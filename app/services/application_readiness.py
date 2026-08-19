"""
Application readiness intelligence for the Pipeline / Apply Hub.

Everything here is computed live from real data (UniversityDocumentItem,
StudentDocument, PipelineEntry) — nothing is fabricated. Where the source
data is missing or ambiguous (most commonly: university deadlines with no
year, or multiple intake dates), the functions here say so explicitly
rather than inventing a number.
"""
import calendar
import re
from datetime import date, datetime

from app.models.student_document import StudentDocument
from app.models.university import University, UniversityDocumentItem

# ── Requirement name → owned document type matching ──────────────────────────
# Keyword sets used to match a freeform requirement name (from
# UniversityDocumentItem.name, or old freetext) to a StudentDocument.doc_type.
# Intentionally conservative: a requirement only counts as "matched" when a
# real keyword hit occurs, never guessed.
DOC_TYPE_KEYWORDS = {
    "transcript": ["transcript", "academic record", "grade sheet", "mark sheet", "diploma"],
    "language_cert": ["ielts", "toefl", "language cert", "english proficiency", "language proficiency", "english test"],
    "passport": ["passport", "national id", "id copy"],
    "photo": ["photo", "passport photo", "photograph"],
    "cv": ["cv", "resume", "curriculum vitae"],
    "recommendation": ["recommendation", "reference letter", "letter of reference"],
}
# Requirement text that is satisfied by the pipeline entry's own fields
# rather than a StudentDocument (e.g. the motivation letter lives on
# PipelineEntry.motivation_letter, not in the document locker).
MOTIVATION_KEYWORDS = ["motivation letter", "letter of motivation", "personal statement", "statement of purpose"]

# Fallback checklist used ONLY when a university has neither structured
# UniversityDocumentItem rows nor usable required_documents freetext — this
# is clearly labeled as generic, never presented as verified per-university data.
GENERIC_FALLBACK_ITEMS = [
    "Transcript / academic records",
    "Language certificate (IELTS/TOEFL)",
    "Passport / ID copy",
    "Motivation letter",
    "CV / Resume",
]


# ── Personal information completeness ────────────────────────────────────────
# Single source of truth for "is the student's profile complete enough to
# apply with". Was previously duplicated client-side in ApplicationHub.jsx's
# PersonalInfoStep — moved here so Pipeline, Apply Hub, the Final Submission
# Check, and AI Chat all read the exact same calculation.
PROFILE_COMPLETENESS_FIELDS = [
    ("full_name", "Full Name"),
    ("gpa", "GPA"),
    ("degree_level", "Degree Level"),
    ("field_of_study", "Field of Study"),
    ("nationality", "Nationality"),
    ("english_level", "English Level"),
    ("language", "Target Language"),
    ("budget_eur", "Budget (€/yr)"),
]


def compute_profile_completeness(profile) -> dict:
    """
    Returns {complete, filled_count, total_count, missing_fields}. `profile`
    is a StudentProfile ORM object or None — a missing profile is simply
    0/N complete, never fabricated as partially filled.
    """
    total = len(PROFILE_COMPLETENESS_FIELDS)
    if profile is None:
        return {
            "complete": False,
            "filled_count": 0,
            "total_count": total,
            "missing_fields": [label for _, label in PROFILE_COMPLETENESS_FIELDS],
        }

    missing = []
    filled = 0
    for key, label in PROFILE_COMPLETENESS_FIELDS:
        value = getattr(profile, key, None)
        if value is None or value == "":
            missing.append(label)
        else:
            filled += 1

    return {
        "complete": filled == total,
        "filled_count": filled,
        "total_count": total,
        "missing_fields": missing,
    }


def match_requirement(name: str, owned_types: set[str], has_motivation_letter: bool) -> tuple[bool, str | None]:
    """Returns (matched, matched_via). matched_via is a doc_type, 'motivation_letter', or None."""
    low = name.lower()
    if any(k in low for k in MOTIVATION_KEYWORDS):
        return has_motivation_letter, "motivation_letter" if has_motivation_letter else None
    for doc_type, keywords in DOC_TYPE_KEYWORDS.items():
        if any(k in low for k in keywords) and doc_type in owned_types:
            return True, doc_type
    return False, None


def evaluate_condition(condition: dict | None, profile) -> bool | None:
    """
    Returns True if the condition clearly applies to this student, False if
    it clearly does NOT apply, or None if it cannot be confidently evaluated
    from the available profile data. Only "nationality" and "education_country"
    conditions are automatically evaluable today — anything else (including
    a missing/unrecognized type, or a student field that isn't filled in)
    returns None. A None result never hides a requirement: showing a
    possibly-irrelevant item is a minor inconvenience, but wrongly hiding a
    genuinely required one is the failure mode this project exists to avoid.
    """
    if not condition:
        return True  # unconditional — always applies
    ctype = condition.get("type")
    values = [str(v).strip().lower() for v in (condition.get("values") or []) if v]
    if not values:
        return None

    if ctype == "nationality":
        nationality = getattr(profile, "nationality", None) if profile else None
        if not nationality:
            return None
        return nationality.strip().lower() in values

    if ctype == "education_country":
        prev_country = getattr(profile, "prev_country", None) if profile else None
        if not prev_country:
            return None
        return prev_country.strip().lower() in values

    return None  # "other" or unrecognized types — never auto-evaluated


def build_requirements(
    db_uni: University,
    degree_level: str | None,
    owned_types: set[str],
    has_motivation_letter: bool,
    profile=None,
) -> dict:
    """
    Builds the live, explainable requirements list for one university.
    Returns {items: [...], source: "verified" | "freetext" | "generic", degree_level_note: str | None}

    `profile` (a StudentProfile ORM object, optional) lets conditional
    requirements (e.g. "APS certificate — only for China/Vietnam/India") be
    evaluated against the actual student instead of shown to everyone —
    see evaluate_condition(). Passing None keeps prior behavior unchanged
    (conditions simply can't be evaluated, so nothing is hidden).
    """
    items = list(db_uni.document_items or [])
    degree_note = None

    if items:
        if degree_level:
            filtered = [i for i in items if i.degree_level in ("all", degree_level)]
            if filtered:
                items = filtered
            else:
                degree_note = f"No {degree_level}-specific requirements found — showing all listed requirements for this university."
        else:
            degree_note = "Set your degree level in your profile for a checklist specific to it."
        items = sorted(items, key=lambda i: i.order_index)
        raw_items = [
            {
                "name": i.name,
                "required": i.is_required,
                "condition": i.condition,
                "source_url": i.source_url,
                "evidence_text": i.evidence_text,
                "verification_status": i.verification_status or "unverified",
                "verified_at": i.verified_at.isoformat() if i.verified_at else None,
            }
            for i in items
        ]
        source = "verified"
    elif db_uni.required_documents:
        # Old freetext field — split into lines, treat everything as required
        # since freetext rarely distinguishes required vs optional. Existing
        # DB text, never independently source-checked -> "unverified", not "verified".
        raw = re.split(r"\n|•|-|\*|\d+\.", db_uni.required_documents)
        # Min length 2 (not 5) — real short requirement names like "CV" or
        # "ID" would otherwise be silently dropped.
        raw_items = [
            {
                "name": line.strip().strip(",:;"), "required": True, "condition": None,
                "source_url": None, "evidence_text": None,
                "verification_status": "unverified", "verified_at": None,
            }
            for line in raw if len(line.strip()) >= 2
        ][:10]
        source = "freetext"
    else:
        # No per-university data at all — genuinely "unknown", not "unverified"
        # (unverified implies specific-but-unchecked data; here there is none).
        raw_items = [
            {
                "name": n, "required": True, "condition": None,
                "source_url": None, "evidence_text": None,
                "verification_status": "unknown", "verified_at": None,
            }
            for n in GENERIC_FALLBACK_ITEMS
        ]
        source = "generic"

    out = []
    for ri in raw_items:
        matched, matched_via = match_requirement(ri["name"], owned_types, has_motivation_letter)
        applies = evaluate_condition(ri["condition"], profile)
        # Only suppress "required" when the condition is confirmed NOT to
        # apply — an unevaluable (None) or applicable (True) condition never
        # hides a requirement, per evaluate_condition()'s doc above.
        effective_required = ri["required"] if applies is not False else False
        out.append({
            "name": ri["name"],
            "required": effective_required,
            "matched": matched,
            "matched_via": matched_via,
            "condition": ri["condition"],
            "condition_applies": applies,
            "source_url": ri["source_url"],
            "evidence_text": ri["evidence_text"],
            "verification_status": ri["verification_status"],
            "verified_at": ri["verified_at"],
        })

    return {"items": out, "source": source, "degree_level_note": degree_note}


def compute_readiness(requirements: dict) -> dict:
    """
    Readiness score = % of REQUIRED items matched. Optional items are shown
    but never counted against the score. Returns None score when there are
    zero required items to compute from — explicit "insufficient data",
    never a fabricated 0% or 100%.
    """
    required = [i for i in requirements["items"] if i["required"]]
    optional = [i for i in requirements["items"] if not i["required"]]
    total = len(required)
    done = sum(1 for i in required if i["matched"])

    if total == 0:
        return {
            "score": None,
            "required_total": 0,
            "required_done": 0,
            "optional_total": len(optional),
            "optional_done": sum(1 for i in optional if i["matched"]),
            "explanation": "Not enough verified requirement data for this university to calculate a score.",
        }

    score = round(100 * done / total)
    return {
        "score": score,
        "required_total": total,
        "required_done": done,
        "optional_total": len(optional),
        "optional_done": sum(1 for i in optional if i["matched"]),
        "explanation": f"{done} of {total} required items complete ({requirements['source']} requirements).",
    }


# ── Deadline parsing ──────────────────────────────────────────────────────────

_MONTHS = "|".join(calendar.month_name[1:]) + "|" + "|".join(calendar.month_abbr[1:])
_PAT_MONTH_DAY = re.compile(rf"\b({_MONTHS})\.?\s+(\d{{1,2}})\b", re.IGNORECASE)
_PAT_DAY_MONTH = re.compile(rf"\b(\d{{1,2}})\s+({_MONTHS})\.?\b", re.IGNORECASE)
_MONTH_LOOKUP = {name.lower(): i for i, name in enumerate(calendar.month_name) if name}
_MONTH_LOOKUP.update({abbr.lower(): i for i, abbr in enumerate(calendar.month_abbr) if abbr})


def _next_occurrence(month: int, day: int, today: date) -> date | None:
    for year in (today.year, today.year + 1):
        try:
            candidate = date(year, month, day)
        except ValueError:
            continue  # invalid day for that month (e.g. Feb 30) — skip rather than guess
        if candidate >= today:
            return candidate
    return None


def parse_deadline(deadline_text: str | None, today: date | None = None) -> dict:
    """
    Extracts every unambiguous month-day pattern from freetext deadline data
    and returns the nearest upcoming one, honestly flagging when the
    university lists multiple intake deadlines (winter/summer) so the
    student knows to verify which applies to them.
    """
    today = today or date.today()
    if not deadline_text:
        return {"parseable": False, "next_date": None, "days_remaining": None, "multiple_dates": False, "raw": deadline_text}

    found = set()
    for m in _PAT_MONTH_DAY.finditer(deadline_text):
        month = _MONTH_LOOKUP.get(m.group(1).lower())
        day = int(m.group(2))
        if month and 1 <= day <= 31:
            found.add((month, day))
    for m in _PAT_DAY_MONTH.finditer(deadline_text):
        day = int(m.group(1))
        month = _MONTH_LOOKUP.get(m.group(2).lower())
        if month and 1 <= day <= 31:
            found.add((month, day))

    if not found:
        return {"parseable": False, "next_date": None, "days_remaining": None, "multiple_dates": False, "raw": deadline_text}

    candidates = [d for d in (_next_occurrence(mo, da, today) for mo, da in found) if d]
    if not candidates:
        return {"parseable": False, "next_date": None, "days_remaining": None, "multiple_dates": False, "raw": deadline_text}

    nearest = min(candidates)
    return {
        "parseable": True,
        "next_date": nearest.isoformat(),
        "days_remaining": (nearest - today).days,
        "multiple_dates": len(found) > 1,
        "raw": deadline_text,
    }


def compute_deadline_risk(deadline_info: dict, readiness: dict) -> dict:
    """Risk level combines real days-remaining with real missing-required-item count."""
    if not deadline_info["parseable"]:
        return {"level": "unknown", "reason": "Deadline could not be reliably determined from available data."}

    days = deadline_info["days_remaining"]
    missing = max(0, (readiness.get("required_total") or 0) - (readiness.get("required_done") or 0))

    if days < 0:
        return {"level": "passed", "reason": "This deadline has passed."}
    if missing == 0:
        return {"level": "on_track", "reason": "All known required items are complete."}
    if days <= 14:
        return {"level": "high", "reason": f"{days} day(s) left and {missing} required item(s) still missing."}
    if days <= 30:
        return {"level": "medium", "reason": f"{days} days left and {missing} required item(s) still missing."}
    return {"level": "low", "reason": f"{days} days left — {missing} required item(s) still missing, but time remains."}


# ── Next best action ──────────────────────────────────────────────────────────

def next_best_action(requirements: dict, deadline_risk: dict, entry_status: str) -> dict:
    """Single highest-priority action, in plain language, with the reason."""
    if entry_status == "decision":
        return {"action": "Decision received — check your result.", "reason": "This application has a decision."}
    if entry_status == "submitted":
        return {"action": "Submitted — waiting for the university's decision.", "reason": "No action needed right now."}

    missing_required = [i for i in requirements["items"] if i["required"] and not i["matched"]]
    if missing_required:
        item = missing_required[0]
        urgency = " — deadline risk is high" if deadline_risk["level"] == "high" else ""
        return {"action": f"Provide: {item['name']}{urgency}", "reason": f"This is a required item that isn't matched to a document yet."}

    if requirements["source"] != "generic":
        return {"action": "All known requirements are met — review and mark ready to submit.", "reason": "No missing required items found."}

    return {"action": "Review this university's official requirements — verified data is limited.", "reason": "UniPath doesn't have enough verified requirement data for full confidence yet."}


# ── Final Submission Check (Phase 5) ──────────────────────────────────────────
# States are deliberately kept distinct — an application we can't confidently
# assess (DATA_INCOMPLETE) is never collapsed into "not ready" (BLOCKED), and
# neither ever claims the university will accept the application.
SUBMISSION_READY = "READY"
SUBMISSION_BLOCKED = "BLOCKED"
SUBMISSION_DATA_INCOMPLETE = "DATA_INCOMPLETE"
SUBMISSION_DEADLINE_PASSED = "DEADLINE_PASSED"


def compute_submission_readiness(
    requirements: dict,
    readiness: dict,
    personal_info: dict,
    has_motivation_letter: bool,
    deadline_info: dict,
    deadline_risk: dict,
) -> dict:
    """
    Combines everything already computed for this application — requirements,
    readiness, personal-info completeness, motivation letter, deadline — into
    one explainable final-submission verdict. Nothing new is fabricated here;
    this only interprets data the rest of the module already produced.
    """
    missing_required = [i["name"] for i in requirements["items"] if i["required"] and not i["matched"]]
    # A motivation-letter requirement (if the university lists one) is already
    # reflected in missing_required via match_requirement — don't double-count
    # it as a second separate issue.
    letter_covered_by_requirement = any(
        any(k in i["name"].lower() for k in MOTIVATION_KEYWORDS) for i in requirements["items"]
    )

    issues = []
    if not personal_info["complete"]:
        issues.append({
            "type": "personal_info",
            "label": f"Personal information — {personal_info['filled_count']}/{personal_info['total_count']} complete",
            "jump_to": "personal",
        })
    for name in missing_required:
        issues.append({"type": "requirement", "label": name, "jump_to": "documents"})
    if not has_motivation_letter and not letter_covered_by_requirement:
        issues.append({"type": "motivation_letter", "label": "Motivation letter missing", "jump_to": "letter"})

    is_generic = requirements["source"] == "generic"
    is_freetext = requirements["source"] == "freetext"
    deadline_passed = deadline_risk.get("level") == "passed"

    if is_generic:
        state = SUBMISSION_DATA_INCOMPLETE
        summary = "Some university-specific requirements could not be verified — we don't have enough confirmed data to determine whether this application is ready."
    elif deadline_passed:
        state = SUBMISSION_DEADLINE_PASSED
        summary = "This deadline has passed. Contact the university directly to check whether late applications are still accepted."
    elif issues:
        state = SUBMISSION_BLOCKED
        summary = f"{len(issues)} item(s) still need your attention before this application is ready."
    else:
        state = SUBMISSION_READY
        if is_freetext:
            summary = "Based on the available requirements, your application appears ready. Some university-specific requirements could not be independently verified, so double-check them on the official portal."
        else:
            summary = "Your application appears complete based on the available university requirements and your current application data."

    confidence_note = None
    if is_generic:
        confidence_note = "This university doesn't have verified requirement data yet — the checklist shown is generic, not university-specific."
    elif is_freetext:
        confidence_note = "Some university-specific requirements could not be independently verified."

    return {
        "state": state,
        "summary": summary,
        "issues": issues,
        "confidence_note": confidence_note,
        "requirements_source": requirements["source"],
        "readiness": readiness,
        "personal_info": personal_info,
        "motivation_letter_complete": bool(has_motivation_letter),
        "deadline": deadline_info,
        "deadline_risk": deadline_risk,
    }
