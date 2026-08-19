"""
Verification invariants and independent audit engine — the mechanical
enforcement behind "NO CLAIM WITHOUT PROOF". A verification_status is not
just a label a human (or Claude) asserts; these functions define, in code,
what evidence a status requires, and independently RE-CHECK the stored
evidence rather than trusting the status label. This is what makes the
database auditable by the product owner directly, not something that
depends on any one session's word.

Source hierarchy (documented here, applied during research — not
mechanically enforced by code, since source *quality* judgment isn't
automatable, only evidence *presence/consistency*):
  Tier 1 — official university sources (admissions page, programme page,
           application portal, faculty/department page, official PDF/regs)
  Tier 2 — official national/government sources (DAAD, uni-assist,
           Hochschulstart, national education ministries/portals)
  Tier 3 — highly reputable institutional sources, only when Tier 1/2
           genuinely cannot answer the question
  Tier 4 — third-party sites — discovery leads ONLY, never sufficient
           evidence for verified/partially_verified
"""
import re
from collections import defaultdict
from urllib.parse import urlparse

from app.models.university import VERIFICATION_STATUSES  # single source of truth

AUDIT_RESULTS = (
    "SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "SOURCE_UNAVAILABLE",
    "OUTDATED_SOURCE", "CONFLICTING_SOURCES", "INSUFFICIENT_EVIDENCE",
)

_STOPWORDS = {
    "the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "if", "is", "are",
    "with", "from", "this", "that", "university", "required", "requires", "must",
    "will", "should", "your", "you", "please", "note", "official", "applicant",
    "applicants", "student", "students", "application", "applications",
}


def _significant_words(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z]+", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in _STOPWORDS}


_NUMBER_RE = re.compile(r"\d+(?:\.\d+)?")  # whole numbers/decimals as one token —
# splitting "7.0" into "7" and "0" separately (a bare \d+ regex) would let
# "IELTS 7.0" wrongly match evidence for "IELTS 6.0" on the shared "0". Found
# by adversarial testing (Phase 2.6) before it could produce a false SUPPORTED.


def _normalize_number_token(tok: str) -> str:
    """'01' and '1' are the SAME number, just zero-padded differently — a
    real university writes deadline-opening dates as either. Comparing raw
    strings treated them as different figures and produced a false
    SOURCE_CHANGED/CLAIM_NOT_SUPPORTED. Found live against real Batch 2 data
    (TU Darmstadt: claim said '1 June', evidence said '01 June'). Normalizes
    by stripping leading zeros from the integer part, preserving decimals
    ('07.5' -> '7.5', '00' -> '0')."""
    if "." in tok:
        whole, frac = tok.split(".", 1)
        whole = whole.lstrip("0") or "0"
        return f"{whole}.{frac}"
    return tok.lstrip("0") or "0"


def _extract_numbers(text: str) -> set[str]:
    return {_normalize_number_token(m) for m in _NUMBER_RE.findall(text or "")}


def _claim_has_unconfirmed_numbers(claim_name: str, evidence_text: str) -> bool:
    """A claim naming a specific figure (a fee amount, a score, a count —
    '€75', 'IELTS 6.5') is not supported by evidence that never mentions
    that figure, no matter how topically related the surrounding words are.
    This catches exactly the case generic word-overlap misses: evidence
    about 'uni-assist is required' reused to justify 'the fee is €75' —
    both texts share 'uni-assist' vocabulary, but the number itself, the
    actual claim, appears nowhere in the evidence. Decimal-aware: '7.0' and
    '6.0' must NOT be treated as matching just because both contain '0'.
    Zero-padding-aware: '01' and '1' ARE treated as the same number."""
    claim_nums = _extract_numbers(claim_name)
    if not claim_nums:
        return False
    evidence_nums = _extract_numbers(evidence_text)
    return not (claim_nums & evidence_nums)


# ── Scope over-claim detection ────────────────────────────────────────────
# A source can be 100% authoritative and still only support a NARROWER claim
# than what we're storing. "Applicants to the Master's Computer Science
# programme must submit a CV" proves a CV requirement for that programme —
# it does NOT prove "CV required for all applicants". These patterns detect
# scope language in the evidence that the stored claim doesn't capture via
# degree_level/condition.
_DEGREE_LEVEL_RE = re.compile(r"\b(master'?s|bachelor'?s|phd|doctoral|undergraduate|postgraduate)\b", re.IGNORECASE)
_NAMED_PROGRAMME_RE = re.compile(r"\b(?:[A-Z][\w.&]*\s){1,4}(?:programme|program)\b")
_APPLICANT_CATEGORY_RE = re.compile(
    r"\b(non-eu|non eu|eu citizens?|international applicants?|international students?|"
    r"applicants? from|nationality|education country|non-german)\b", re.IGNORECASE,
)
# Real evidence rarely writes "applicants from X" adjacent — e.g. LMU's own
# APS wording is "Applicants with university degrees from the PR China,
# India and Vietnam". This catches "from <Country list>" regardless of what
# comes between "applicants" and "from" — found via Phase 2.7 adversarial
# testing (the exact APS example used throughout this project's own audit
# history failed to trigger a strict comma/and-separated regex, since real
# country names can themselves be multi-word ("the PR China")).
_FROM_WINDOW_RE = re.compile(r"\bfrom\s+((?:the\s+)?[A-Z][\w\s,]{2,60}?)(?:\s+\b(?:must|should|are|will|need|require)\b|[.;])", re.IGNORECASE)


def _mentions_nationality_list(evidence_text: str) -> str | None:
    """Loosely detects 'from <two or more capitalized names joined by a
    comma/and/or>' within a short window after 'from' — a real signal of a
    nationality/country list, without requiring rigid adjacent-comma
    formatting that real prose doesn't reliably follow."""
    m = _FROM_WINDOW_RE.search(evidence_text)
    if not m:
        return None
    window = m.group(1)
    cap_words = re.findall(r"\b[A-Z][a-zA-Z]+\b", window)
    if len(cap_words) >= 2 and (("," in window) or re.search(r"\band\b|\bor\b", window, re.IGNORECASE)):
        return window.strip()
    return None


def _detect_unrepresented_scope(evidence_text: str, condition: dict | None, degree_level: str | None) -> list[str]:
    """Returns human-readable findings when the evidence contains scope
    language (degree level / named programme / applicant category) that the
    stored claim doesn't already capture. Non-empty findings mean the claim
    as stored risks being read as broader than what's actually proven."""
    if not evidence_text:
        return []
    findings = []

    m = _DEGREE_LEVEL_RE.search(evidence_text)
    if m and (not degree_level or degree_level == "all"):
        findings.append(f"Evidence mentions a specific degree level ('{m.group(0)}') but this claim is stored as degree_level='{degree_level or 'all'}' (unscoped).")

    m = _NAMED_PROGRAMME_RE.search(evidence_text)
    if m:
        findings.append(f"Evidence names a specific programme ('{m.group(0).strip()}') — this claim is not scoped to that programme.")

    m = _APPLICANT_CATEGORY_RE.search(evidence_text)
    if m and not condition:
        findings.append(f"Evidence contains an applicant-category qualifier ('{m.group(0)}') not captured in a structured `condition`.")

    nat_window = _mentions_nationality_list(evidence_text)
    if nat_window and not condition:
        findings.append(f"Evidence names specific countries/nationalities ('{nat_window}') not captured in a structured `condition`.")

    return findings


# ── Source hierarchy classification ─────────────────────────────────────────
# Tier judgment about a domain's general trustworthiness IS partially
# automatable (a Reddit/Quora/aggregator URL is never Tier 1, no matter what
# it says) — this is a real, if approximate, mechanical safeguard, not a
# full replacement for the human research-time judgment call.
_TIER5_DOMAIN_MARKERS = (
    "reddit.com", "quora.com", "facebook.com", "twitter.com", "x.com", "tiktok.com",
    "collegevine.com", "collegedunia.com", "mygermanuniversity.com", "successcribe.com",
    "careers360.com", "libertify.com", "itsstudent.com", "listyfy.com", "studocu.com",
    "scribd.com", "college-council.com",
)
_TIER2_DOMAIN_MARKERS = ("uni-assist.de", "daad.de", "hochschulstart.de", "anabin.kmk.org")


def classify_source_tier(source_url: str | None, university_website: str | None = None) -> int | None:
    """Returns 1 (official university), 2 (official national platform),
    5 (known low-quality/discovery-only), or 3 (unclassified — treated
    conservatively, neither trusted as Tier 1 nor blocklisted). None if no
    URL. This is a heuristic safety net, not a substitute for checking the
    domain yourself when researching."""
    if not source_url:
        return None
    domain = urlparse(source_url).netloc.lower()
    if any(marker in domain for marker in _TIER5_DOMAIN_MARKERS):
        return 5
    if any(marker in domain for marker in _TIER2_DOMAIN_MARKERS):
        return 2
    if university_website:
        uni_domain = urlparse(university_website).netloc.lower().replace("www.", "")
        if uni_domain and uni_domain in domain:
            return 1
    if re.search(r"\.(edu|ac\.[a-z]{2,})$", domain) or domain.startswith("uni-") or ".uni-" in domain or "university" in domain:
        return 1
    return 3


def _evidence_overlap_ratio(claim_name: str, evidence_text: str) -> float:
    """Crude but real: what fraction of the claim's significant words
    actually appear somewhere in the evidence text? A near-zero ratio is a
    strong, mechanically-detectable signal that the evidence was written
    for a DIFFERENT claim and reused — exactly the mistake this audit is
    designed to catch (e.g. uni-assist-usage evidence copy-pasted onto a
    specific fee-amount claim it never mentions)."""
    claim_words = _significant_words(claim_name)
    if not claim_words:
        return 1.0
    evidence_words = _significant_words(evidence_text)
    return len(claim_words & evidence_words) / len(claim_words)


def audit_verification_fields(
    verification_status: str,
    source_url: str | None,
    evidence_text: str | None,
    verified_at,
) -> list[str]:
    """
    Returns a list of violation messages (empty = compliant).

    Invariants:
      verified                    -> source_url AND evidence_text AND verified_at all present
      partially_verified          -> evidence_text present (source_url encouraged but not
                                      mechanically required — a partial claim may rest on
                                      an official source without a stable deep link)
      conflicting                 -> evidence_text present (must show what's being disputed)
      needs_manual_verification   -> evidence_text present (the original claim being flagged
                                      for manual follow-up must still be visible)
      unverified / unknown        -> no field requirements (these statuses make no proof
                                      claim in the first place)
    """
    problems = []
    if verification_status == "verified":
        if not source_url:
            problems.append("verification_status='verified' requires source_url")
        if not evidence_text:
            problems.append("verification_status='verified' requires evidence_text")
        if not verified_at:
            problems.append("verification_status='verified' requires verified_at")
    elif verification_status in ("partially_verified", "conflicting", "needs_manual_verification"):
        if not evidence_text:
            problems.append(f"verification_status='{verification_status}' requires evidence_text")
    elif verification_status in ("unverified", "unknown"):
        pass
    else:
        problems.append(f"invalid verification_status: {verification_status!r}")
    return problems


def compute_verification_coverage(document_items: list, deadlines: list | None = None) -> dict:
    """
    A university-level SUMMARY of how much of what we store has evidence —
    deliberately NOT an "accuracy" score. It says nothing about the
    probability the data is correct; it only says how much of it has been
    checked against a source at all. Named verification_coverage for
    exactly that reason — never rename this to imply confidence in
    correctness beyond "has evidence vs. doesn't".
    """
    deadlines = deadlines or []
    all_items = list(document_items) + list(deadlines)
    total = len(all_items)
    if total == 0:
        return {
            "total_claims": 0, "verified": 0, "partially_verified": 0,
            "unverified": 0, "unknown": 0, "conflicting": 0, "needs_manual_verification": 0,
            "verification_coverage_pct": None,
        }

    counts = {s: 0 for s in VERIFICATION_STATUSES}
    for it in all_items:
        status = getattr(it, "verification_status", None) or "unverified"
        counts[status] = counts.get(status, 0) + 1

    # "Covered" = has SOME independently traceable evidence on record —
    # verified, partially_verified, conflicting (both sides ARE evidenced,
    # just disputed), or needs_manual_verification (evidence recorded, live
    # check just couldn't confirm it). unverified/unknown are NOT covered.
    covered = counts["verified"] + counts["partially_verified"] + counts["conflicting"] + counts["needs_manual_verification"]
    pct = round(100 * covered / total)

    return {
        "total_claims": total,
        "verified": counts["verified"],
        "partially_verified": counts["partially_verified"],
        "unverified": counts["unverified"],
        "unknown": counts["unknown"],
        "conflicting": counts["conflicting"],
        "needs_manual_verification": counts["needs_manual_verification"],
        "verification_coverage_pct": pct,
    }


# ── Independent audit: does the stored evidence actually support the claim? ──

def audit_claim(
    claim_name: str,
    verification_status: str,
    source_url: str | None,
    evidence_text: str | None,
    verified_at,
    condition: dict | None = None,
    cycle: str | None = None,
    current_cycle: str | None = None,
    degree_level: str | None = None,
    university_website: str | None = None,
    claim_kind: str = "requirement",
) -> dict:
    """
    Independently re-derives whether a stored claim is actually supported —
    NEVER just echoes verification_status back. A row can say 'verified'
    and still audit as NOT_SUPPORTED (or PARTIALLY_SUPPORTED) if what's
    actually stored doesn't hold up; that mismatch is the whole point of
    this function.

    Check order (each can short-circuit to a result):
      1. status claims no evidence at all           -> INSUFFICIENT_EVIDENCE
      2. no source_url                               -> SOURCE_UNAVAILABLE
      3. no/trivial evidence_text                     -> INSUFFICIENT_EVIDENCE
      4. source domain is known low-quality (Tier 5)  -> NOT_SUPPORTED
      5. claim names a figure absent from evidence    -> NOT_SUPPORTED
      6. evidence shares ~no vocabulary with claim     -> NOT_SUPPORTED
      7. evidence cycle is older than current_cycle    -> OUTDATED_SOURCE
      8. evidence is narrower in scope than the claim  -> PARTIALLY_SUPPORTED
      9. status is partially_verified                  -> PARTIALLY_SUPPORTED
      10. moderate (not strong) vocabulary overlap      -> PARTIALLY_SUPPORTED
      11. otherwise                                     -> SUPPORTED

    Returns {"audit_result": one of AUDIT_RESULTS, "reasons": [...]}.
    """
    if verification_status in ("unverified", "unknown"):
        return {"audit_result": "INSUFFICIENT_EVIDENCE",
                "reasons": [f"verification_status='{verification_status}' — no evidence is being claimed."]}

    if verification_status not in VERIFICATION_STATUSES:
        return {"audit_result": "INSUFFICIENT_EVIDENCE", "reasons": [f"Invalid verification_status: {verification_status!r}"]}

    if not source_url:
        return {"audit_result": "SOURCE_UNAVAILABLE", "reasons": ["No source_url on record — claim cannot be independently opened and checked."]}

    if not evidence_text or len(evidence_text.strip()) < 15:
        return {"audit_result": "INSUFFICIENT_EVIDENCE", "reasons": ["evidence_text is missing or too short to independently confirm the claim."]}

    tier = classify_source_tier(source_url, university_website)
    if tier == 5:
        return {"audit_result": "NOT_SUPPORTED",
                "reasons": [f"Source domain ({urlparse(source_url).netloc}) is a known low-quality/discovery-only source — "
                            f"never sufficient evidence for a verified or partially_verified claim, regardless of what it says."]}

    # Numeric-figure matching is for fee/score/count-style claims — deadline
    # dates have their own dedicated, format-aware comparison
    # (deadline_evidence_has_uncaptured_intakes, applied separately by the
    # caller), because date notation varies too much across sources
    # ("2 May" vs "02.05.") to compare as generic numbers without false
    # mismatches — found via real-data testing (Humboldt Winter/undergrad
    # deadline: '2 May' vs official '02.05.' — same date, different format).
    if claim_kind != "deadline" and _claim_has_unconfirmed_numbers(claim_name, evidence_text):
        return {"audit_result": "NOT_SUPPORTED",
                "reasons": ["The claim names a specific figure (e.g. a fee/score/count) that does not appear anywhere in the evidence text — "
                            "topical similarity is not proof of this specific number."]}

    overlap = _evidence_overlap_ratio(claim_name, evidence_text)
    if overlap < 0.15:
        return {"audit_result": "NOT_SUPPORTED",
                "reasons": [f"Evidence text shares almost no vocabulary with the claim (word overlap ~{overlap:.0%}) — "
                            f"this evidence likely supports a DIFFERENT claim, not this one."]}

    if cycle and current_cycle and cycle != current_cycle:
        return {"audit_result": "OUTDATED_SOURCE",
                "reasons": [f"Evidence is recorded for cycle '{cycle}', current cycle is '{current_cycle}' — re-verification recommended."]}

    scope_findings = _detect_unrepresented_scope(evidence_text, condition, degree_level)
    if scope_findings:
        return {"audit_result": "PARTIALLY_SUPPORTED",
                "reasons": ["Evidence appears narrower in scope than the stored claim — never auto-widened to a universal claim:"] + scope_findings}

    reasons = []
    if verification_status == "conflicting":
        reasons.append("Stored as conflicting — two authoritative sources disagree; this claim is never fully confirmed until the conflict is resolved.")
        return {"audit_result": "CONFLICTING_SOURCES", "reasons": reasons}

    if verification_status == "needs_manual_verification":
        reasons.append("Stored as needs_manual_verification — the live source could not be reliably inspected (bot protection/JS rendering/unreadable PDF); a human must confirm this claim.")
        return {"audit_result": "INSUFFICIENT_EVIDENCE", "reasons": reasons}

    if verification_status == "partially_verified":
        reasons.append("Stored as partially_verified — evidence does not confirm the full claim, by design.")
        return {"audit_result": "PARTIALLY_SUPPORTED", "reasons": reasons}

    if overlap < 0.5:
        reasons.append(f"Evidence overlap with the claim is only moderate (~{overlap:.0%}) — evidence may not cover the entire claim.")
        return {"audit_result": "PARTIALLY_SUPPORTED", "reasons": reasons}

    reasons.append(f"Source and evidence present; evidence vocabulary overlap ~{overlap:.0%}; cycle consistent (or not applicable); no unrepresented scope detected.")
    return {"audit_result": "SUPPORTED", "reasons": reasons}


import calendar

_MONTHS_ALT = "|".join(calendar.month_name[1:]) + "|" + "|".join(calendar.month_abbr[1:])
_DATE_RE = re.compile(rf"\b(?:{_MONTHS_ALT})\.?\s+\d{{1,2}}\b|\b\d{{1,2}}\s+(?:{_MONTHS_ALT})\.?\b", re.IGNORECASE)

_MONTH_NUM = {name.lower(): i for i, name in enumerate(calendar.month_name) if name}
_MONTH_NUM.update({abbr.lower(): i for i, abbr in enumerate(calendar.month_abbr) if abbr})

# ── Compact date-range normalization (Phase 2.8.1) ──────────────────────────
# '1-31 March', '1 to 31 March', '1 March - 31 March', '01.03.-31.03.' are
# all the SAME fact stated in different notations. Treating them as
# different facts (the pre-2.8.1 behaviour) produced a safe-direction but
# unnecessary PARTIALLY_SUPPORTED downgrade whenever a researcher's
# shorthand ("1-31 March") didn't textually match a source's spelled-out
# form ("1 March to 31 March"). This normalizes — it does NOT infer a
# missing date; a range with no month, or a bare single date, is untouched.
_RANGE_SAME_MONTH_RE = re.compile(rf"\b(\d{{1,2}})\s*(?:-|–|to)\s*(\d{{1,2}})\s+({_MONTHS_ALT})\.?\b", re.IGNORECASE)
_RANGE_MONTH_REPEATED_RE = re.compile(rf"\b(\d{{1,2}})\s+({_MONTHS_ALT})\.?\s*(?:-|–|to)\s*(\d{{1,2}})\s+({_MONTHS_ALT})\.?\b", re.IGNORECASE)
# German/European DD.MM.-DD.MM. notation — day-before-month is the
# consistent convention on the German university sites this project
# researches; not a universal disambiguation, a documented scoped
# assumption (see Phase 2.8.1 report).
_RANGE_DOTTED_RE = re.compile(r"(?<!\d)(\d{1,2})\.(\d{1,2})\.\s*(?:-|–)\s*(\d{1,2})\.(\d{1,2})\.")


def extract_date_ranges(text: str) -> set[tuple[int, int, int, int]]:
    """
    Returns a set of (start_day, start_month, end_day, end_month) tuples —
    the canonical form every supported range notation normalizes to.
    '1-31 March' == '1 to 31 March' == '1 March - 31 March' == '01.03.-31.03.'
    all -> {(1, 3, 31, 3)}.
    """
    text = text or ""
    ranges = set()
    for m in _RANGE_MONTH_REPEATED_RE.finditer(text):
        d1, mo1, d2, mo2 = m.groups()
        mo1n, mo2n = _MONTH_NUM.get(mo1.lower()), _MONTH_NUM.get(mo2.lower())
        if mo1n and mo2n:
            ranges.add((int(d1), mo1n, int(d2), mo2n))
    for m in _RANGE_SAME_MONTH_RE.finditer(text):
        d1, d2, mo = m.groups()
        mon = _MONTH_NUM.get(mo.lower())
        if mon:
            ranges.add((int(d1), mon, int(d2), mon))
    for m in _RANGE_DOTTED_RE.finditer(text):
        d1, mo1, d2, mo2 = m.groups()
        ranges.add((int(d1), int(mo1), int(d2), int(mo2)))
    return ranges


def _extract_dates(text: str) -> set[str]:
    return {m.group(0).lower() for m in _DATE_RE.finditer(text or "")}


def deadline_evidence_has_uncaptured_intakes(deadline_text: str, evidence_text: str) -> bool:
    """
    'July 15 for Winter intake; January 15 for Summer intake' proves TWO
    distinct deadlines — a stored deadline_text of just '15 July' is a real
    under-representation of what the evidence says, not the same fact
    stated once. Detects when evidence mentions more distinct dates than
    the stored claim captures.

    Range-aware (Phase 2.8.1): first checks whether every date RANGE in the
    evidence is already covered by an equivalent range in the deadline_text
    (regardless of notation) — only falls through to the older single-date
    count heuristic when no ranges are involved at all.
    """
    claim_ranges = extract_date_ranges(deadline_text)
    evidence_ranges = extract_date_ranges(evidence_text)
    if evidence_ranges:
        # Every range the evidence mentions is already represented in the
        # claim (same normalized tuple) -> nothing uncaptured, regardless
        # of how each side spelled it.
        return not evidence_ranges.issubset(claim_ranges)

    claim_dates = _extract_dates(deadline_text)
    evidence_dates = _extract_dates(evidence_text)
    return len(evidence_dates) > len(claim_dates) and len(evidence_dates) >= 2


def detect_deadline_conflicts(deadlines: list) -> list[list]:
    """
    Groups verified/partially_verified UniversityDeadline rows for one
    university by (label, condition) signature — rows that claim to
    describe the SAME scope — and flags any group where the deadline_text
    disagrees. Two authoritative-looking sources disagreeing is never
    silently resolved; it's surfaced as CONFLICTING_SOURCES with both rows
    preserved (never deleted, never picked-for-you).
    """
    groups = defaultdict(list)
    for d in deadlines:
        if d.verification_status not in ("verified", "partially_verified"):
            continue
        sig = ((d.label or "").strip().lower(), str(d.condition))
        groups[sig].append(d)

    conflicts = []
    for rows in groups.values():
        texts = {(r.deadline_text or "").strip().lower() for r in rows}
        if len(texts) > 1:
            conflicts.append(rows)
    return conflicts


def generate_university_audit_report(university, current_cycle: str | None = None) -> dict:
    """
    The complete, independently-checkable audit report for one university —
    every document-item and deadline claim re-derived through audit_claim(),
    plus conflict detection and the coverage summary. This is what the
    product owner inspects; nothing here is asserted, it's recomputed from
    the stored fields every time this function runs.
    """
    items = list(university.document_items or [])
    deadlines = list(university.deadlines or [])
    coverage = compute_verification_coverage(items, deadlines)

    item_rows = []
    for i in items:
        audit = audit_claim(i.name, i.verification_status, i.source_url, i.evidence_text, i.verified_at, i.condition,
                             current_cycle=current_cycle, degree_level=i.degree_level, university_website=university.website)
        item_rows.append({
            "type": "requirement", "claim": i.name, "required": i.is_required, "degree_level": i.degree_level,
            "condition": i.condition, "verification_status": i.verification_status,
            "source_url": i.source_url, "evidence_text": i.evidence_text, "verified_at": i.verified_at,
            **audit,
        })

    conflict_groups = detect_deadline_conflicts(deadlines)
    conflicting_ids = {r.id for group in conflict_groups for r in group}

    deadline_rows = []
    for d in deadlines:
        if d.id in conflicting_ids:
            audit = {"audit_result": "CONFLICTING_SOURCES",
                      "reasons": ["Another verified/partially_verified deadline row for the same scope states a different deadline_text — see conflicts."]}
        else:
            # The CLAIM being audited is the fact "for <label>, the deadline is
            # <deadline_text>" — not just the label. label alone is an
            # identifier (e.g. "Heidelberg Graduate School for Physics"), and
            # checking evidence overlap against an identifier rather than the
            # actual date/window claim produces false NOT_SUPPORTED results
            # (caught by running this against real data — see report).
            deadline_claim = f"{d.label} — {d.deadline_text}"
            audit = audit_claim(deadline_claim, d.verification_status, d.source_url, d.evidence_text, d.verified_at, d.condition,
                                 cycle=d.cycle, current_cycle=current_cycle, university_website=university.website, claim_kind="deadline")
            # Multi-intake check: the evidence may prove MORE distinct dates
            # than this single row captures (e.g. evidence names both a
            # Winter and Summer date but this row only stores one) — that's
            # a real under-representation, never silently collapsed.
            if audit["audit_result"] == "SUPPORTED" and deadline_evidence_has_uncaptured_intakes(d.deadline_text, d.evidence_text):
                audit = {"audit_result": "PARTIALLY_SUPPORTED",
                          "reasons": ["Evidence mentions more distinct dates than this row's deadline_text captures — "
                                      "verify this row's intake/scope covers only what it claims, not every date the evidence lists."]}
        deadline_rows.append({
            "type": "deadline", "claim": d.label, "deadline_text": d.deadline_text, "cycle": d.cycle,
            "condition": d.condition, "verification_status": d.verification_status,
            "source_url": d.source_url, "evidence_text": d.evidence_text, "verified_at": d.verified_at,
            **audit,
        })

    return {
        "university": university.name,
        "university_id": university.id,
        "country": university.country,
        "coverage": coverage,
        "requirements": item_rows,
        "deadlines": deadline_rows,
        "conflicts": [[r.id for r in group] for group in conflict_groups],
    }


def render_audit_report_markdown(report: dict) -> str:
    """Owner-facing Markdown rendering — open-source-and-check-it-yourself
    format, no UI required."""
    lines = [f"# Verification Audit — {report['university']} (id {report['university_id']}, {report['country']})", ""]
    cov = report["coverage"]
    lines.append(f"**Requirements/deadlines tracked:** {cov['total_claims']}  ")
    lines.append(f"**Verified:** {cov['verified']} | **Partially verified:** {cov['partially_verified']} | "
                  f"**Unverified:** {cov['unverified']} | **Unknown:** {cov['unknown']} | "
                  f"**Conflicting:** {cov.get('conflicting', 0)} | **Needs manual verification:** {cov.get('needs_manual_verification', 0)}  ")
    pct = cov["verification_coverage_pct"]
    lines.append(f"**Verification coverage:** {pct if pct is not None else 'n/a'}%"
                  f" — *the % of tracked claims with SOME stored evidence, NOT an accuracy score.*")
    lines.append("")

    if report["conflicts"]:
        lines.append("## ⚠ Conflicting sources detected")
        for group_ids in report["conflicts"]:
            lines.append(f"- Deadline row IDs {group_ids} disagree on the same scope — both preserved, neither auto-resolved.")
        lines.append("")

    for section, rows in (("Requirements", report["requirements"]), ("Deadlines", report["deadlines"])):
        lines.append(f"## {section}")
        for r in rows:
            lines.append(f"### {r['claim']}")
            lines.append(f"- **Status:** {r['verification_status']}")
            lines.append(f"- **Audit result:** `{r['audit_result']}`")
            for reason in r["reasons"]:
                lines.append(f"  - {reason}")
            if r.get("condition"):
                lines.append(f"- **Condition:** {r['condition']}")
            lines.append(f"- **Source:** {r['source_url'] or '—'}")
            lines.append(f"- **Evidence:** \"{r['evidence_text']}\"" if r["evidence_text"] else "- **Evidence:** —")
            if r["type"] == "deadline":
                lines.append(f"- **Deadline text:** {r['deadline_text']} (cycle: {r.get('cycle') or 'not stated'})")
            lines.append(f"- **Verified at:** {r['verified_at'] or '—'}")
            lines.append("")

    return "\n".join(lines)
