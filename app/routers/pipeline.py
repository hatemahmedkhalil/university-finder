import json
import logging
import re
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.ai_client import chat_completion, ai_configured
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_current_user, get_db, require_admin
from app.models.calendar_event import CalendarEvent
from app.models.pipeline import PipelineEntry, VALID_STATUSES, VALID_DECISIONS
from app.models.student_document import StudentDocument
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User
from app.services.application_readiness import (
    build_requirements, compute_readiness, parse_deadline,
    compute_deadline_risk, next_best_action,
    compute_profile_completeness, compute_submission_readiness,
)

logger = logging.getLogger("university_finder")

router = APIRouter(prefix="/pipeline", tags=["Application Pipeline"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class UniSnap(BaseModel):
    id: int
    name: str
    city: str
    country: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    application_method: Optional[str] = None
    application_portal_url: Optional[str] = None
    application_deadline: Optional[str] = None
    is_public: bool = True
    model_config = {"from_attributes": True}


class PipelineOut(BaseModel):
    id: int
    university_id: int
    status: str
    fit_score: Optional[int] = None
    fit_analysis: Optional[str] = None
    fit_gaps: Optional[list] = None
    motivation_letter: Optional[str] = None
    checklist: Optional[list] = None
    deadline_note: Optional[str] = None
    decision: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    university: UniSnap
    # ── Application intelligence (computed live, never stored/stale) ──
    requirements: Optional[dict] = None
    readiness: Optional[dict] = None
    deadline: Optional[dict] = None
    deadline_risk: Optional[dict] = None
    next_action: Optional[dict] = None
    model_config = {"from_attributes": True}


class PipelineCreate(BaseModel):
    university_id: int


class PipelineUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)
    motivation_letter: Optional[str] = None
    checklist: Optional[list] = None
    deadline_note: Optional[str] = Field(None, max_length=200)


class AdminDecisionUpdate(BaseModel):
    decision: Optional[str] = None   # accepted | rejected | waitlisted | None (clear)
    admin_note: Optional[str] = Field(None, max_length=500)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_checklist(required_docs_text: str, owned_types: set[str]) -> list[dict]:
    """Convert freetext required_documents into a structured checklist."""
    if not required_docs_text:
        return []
    raw = re.split(r"\n|•|-|\*|\d+\.", required_docs_text)
    items = []
    for line in raw:
        line = line.strip().strip(",:;")
        if len(line) < 5:
            continue
        low = line.lower()
        # auto-tick if student has this doc type in their locker
        auto_done = (
            ("transcript" in low and "transcript" in owned_types) or
            ("passport" in low and "passport" in owned_types) or
            ("cv" in low and "cv" in owned_types) or
            ("photo" in low and "photo" in owned_types) or
            ("ielts" in low or "english" in low or "language" in low) and "language_cert" in owned_types or
            ("recommend" in low and "recommendation" in owned_types)
        )
        items.append({"item": line, "done": auto_done})
        if len(items) >= 10:
            break
    return items


def _build_profile_summary(profile: Optional[StudentProfile]) -> str:
    if not profile:
        return "No profile available."
    parts = []
    if profile.nationality:
        parts.append(f"Nationality: {profile.nationality}")
    if profile.degree_level:
        parts.append(f"Degree level: {profile.degree_level}")
    if profile.gpa:
        parts.append(f"GPA: {profile.gpa}/4.0")
    if profile.field_of_study:
        parts.append(f"Field of study: {profile.field_of_study}")
    if profile.english_level:
        level = profile.english_level.value if hasattr(profile.english_level, 'value') else str(profile.english_level)
        parts.append(f"English level: {level.upper()}")
    if profile.language:
        parts.append(f"Preferred language: {profile.language}")
    if profile.placement_results:
        for lang, res in profile.placement_results.items():
            parts.append(f"{lang.capitalize()} placement: {res.get('level', '')}")
    if profile.budget_eur:
        parts.append(f"Budget: €{profile.budget_eur}/year")
    if profile.preferred_countries:
        parts.append(f"Preferred countries: {profile.preferred_countries}")
    return "; ".join(parts) if parts else "No profile details."


def _build_uni_summary(uni: University) -> str:
    parts = [f"{uni.name}, {uni.city}, {uni.country}"]
    if uni.ranking:
        parts.append(f"Ranking: #{uni.ranking}")
    if uni.min_gpa:
        parts.append(f"Minimum GPA: {uni.min_gpa}")
    if uni.language_requirements:
        parts.append(f"Language requirements: {uni.language_requirements[:200]}")
    if uni.admission_requirements:
        parts.append(f"Admission requirements: {uni.admission_requirements[:300]}")
    if uni.tuition_fee_eur is not None:
        parts.append(f"Tuition: €{uni.tuition_fee_eur}/year")
    if uni.programs:
        parts.append(f"Programs offered: {uni.programs[:200]}")
    return ". ".join(parts)


def _run_ai_analysis(profile: Optional[StudentProfile], uni: University) -> dict:
    """Call Groq once and get fit score, gaps, analysis, and motivation letter."""
    if not ai_configured():
        return {}

    profile_text = _build_profile_summary(profile)
    uni_text = _build_uni_summary(uni)

    prompt = f"""You are an expert university admissions consultant for Arabic-speaking students applying to European universities.

Student profile: {profile_text}
Target university: {uni_text}

Analyze this student's fit for this university and write a motivation letter.
Respond ONLY with valid JSON — no markdown, no explanation, just the JSON object:

{{
  "fit_score": <integer 0-100>,
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "gaps": ["<gap or missing requirement>", "<gap>"],
  "recommendation": "<2-3 sentences of honest advice for this student>",
  "motivation_letter": "<professional motivation letter, 380-420 words, formal tone, specific to this university>"
}}"""

    try:
        raw = chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1400,
            temperature=0.65,
        )
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as e:
        logger.error("Pipeline AI analysis error: %s", e)
        return {}


def _entry_to_out(
    entry: PipelineEntry,
    owned_types: set[str] | None = None,
    degree_level: str | None = None,
    profile: "StudentProfile | None" = None,
) -> dict:
    """Deserialize JSON fields for the response, and — when document/profile
    context is supplied — compute live application intelligence (readiness,
    requirements, deadline risk, next action). owned_types=None skips the
    intelligence block entirely (used nowhere currently, kept for safety).
    `profile` lets conditional requirements (e.g. APS — only for certain
    nationalities) be evaluated against the real student; omitting it just
    means conditions can't be evaluated, never that one is wrongly hidden."""
    d = {
        "id": entry.id,
        "university_id": entry.university_id,
        "status": entry.status,
        "fit_score": entry.fit_score,
        "fit_analysis": entry.fit_analysis,
        "fit_gaps": json.loads(entry.fit_gaps) if entry.fit_gaps else None,
        "motivation_letter": entry.motivation_letter,
        "checklist": json.loads(entry.checklist) if entry.checklist else None,
        "deadline_note": entry.deadline_note,
        "decision": entry.decision,
        "notes": entry.notes,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
        "university": entry.university,
    }

    if owned_types is not None:
        requirements = build_requirements(
            entry.university, degree_level, owned_types, bool(entry.motivation_letter), profile,
        )
        readiness = compute_readiness(requirements)
        deadline = parse_deadline(entry.university.application_deadline)
        deadline_risk = compute_deadline_risk(deadline, readiness)
        action = next_best_action(requirements, deadline_risk, entry.status)

        d["requirements"] = requirements
        d["readiness"] = readiness
        d["deadline"] = deadline
        d["deadline_risk"] = deadline_risk
        d["next_action"] = action

    return d


def _readiness_context(db: Session, user_id: int) -> tuple[set[str], str | None, "StudentProfile | None"]:
    """owned document types + degree level + profile for the given student —
    the real signals the readiness/requirements engine is computed from."""
    owned_types = {
        d.doc_type for d in db.query(StudentDocument).filter(StudentDocument.user_id == user_id).all()
    }
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    degree_level = None
    if profile and profile.degree_level:
        degree_level = profile.degree_level.value if hasattr(profile.degree_level, "value") else str(profile.degree_level)
    return owned_types, degree_level, profile


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
def list_pipeline(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = (
        db.query(PipelineEntry)
        .filter(PipelineEntry.user_id == current_user.id)
        .order_by(PipelineEntry.created_at.desc())
        .all()
    )
    owned_types, degree_level, profile = _readiness_context(db, current_user.id)
    return [_entry_to_out(e, owned_types, degree_level, profile) for e in entries]


@router.get("/{entry_id}")
def get_pipeline_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Single entry, with the same live intelligence block as the list —
    this is what Apply Hub uses to know exactly which application it's
    working on (the entry_id in the URL is the one source of truth, never
    frontend-only state)."""
    entry = db.query(PipelineEntry).filter(
        PipelineEntry.id == entry_id,
        PipelineEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    owned_types, degree_level, profile = _readiness_context(db, current_user.id)
    return _entry_to_out(entry, owned_types, degree_level, profile)


@router.get("/{entry_id}/submission-check")
def get_submission_check(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Final Submission Check — answers "is this application actually ready to
    submit?" using the exact same requirements/readiness/deadline engine as
    the rest of the Pipeline/Apply Hub (never a second, separate calculation).
    Scoped strictly to the authenticated user's own entry — a university_id
    supplied by the frontend is never trusted for this.
    """
    entry = db.query(PipelineEntry).filter(
        PipelineEntry.id == entry_id,
        PipelineEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    owned_types, degree_level, profile = _readiness_context(db, current_user.id)

    requirements = build_requirements(entry.university, degree_level, owned_types, bool(entry.motivation_letter), profile)
    readiness = compute_readiness(requirements)
    deadline = parse_deadline(entry.university.application_deadline)
    deadline_risk = compute_deadline_risk(deadline, readiness)
    personal_info = compute_profile_completeness(profile)

    result = compute_submission_readiness(
        requirements, readiness, personal_info, bool(entry.motivation_letter), deadline, deadline_risk,
    )
    result["entry_id"] = entry.id
    result["entry_status"] = entry.status
    return result


def create_pipeline_entry(db: Session, user_id: int, university_id: int) -> PipelineEntry:
    """
    The ONE place a PipelineEntry gets created — always with a valid status,
    real AI fit analysis, a real checklist, and calendar sync. Used by both
    the HTTP route below and the AI Chat "add_pipeline" action, so there is
    no second, weaker write path that can produce an invalid/bare entry.

    Raises ValueError("not_found") / ValueError("duplicate") for the caller
    to translate into the right HTTP status.
    """
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise ValueError("not_found")

    existing = db.query(PipelineEntry).filter(
        PipelineEntry.user_id == user_id,
        PipelineEntry.university_id == university_id,
    ).first()
    if existing:
        raise ValueError("duplicate")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    owned_docs = db.query(StudentDocument).filter(StudentDocument.user_id == user_id).all()
    owned_types = {d.doc_type for d in owned_docs}

    # Run AI analysis (synchronous — Groq is fast)
    ai = _run_ai_analysis(profile, uni)

    # Build checklist from university requirements
    checklist = _parse_checklist(uni.required_documents or "", owned_types)
    # Supplement with common docs if checklist is empty
    if not checklist:
        checklist = [
            {"item": "Transcript / Academic records", "done": "transcript" in owned_types},
            {"item": "Language certificate (IELTS/TOEFL)", "done": "language_cert" in owned_types},
            {"item": "Passport / ID copy", "done": "passport" in owned_types},
            {"item": "Motivation letter", "done": bool(ai.get("motivation_letter"))},
            {"item": "CV / Resume", "done": "cv" in owned_types},
        ]

    deadline = uni.application_deadline or None

    strengths = ai.get("strengths") or []
    gaps = ai.get("gaps") or []
    fit_gaps_list = list(gaps)
    if strengths:
        fit_gaps_list.append(f"Strengths: {', '.join(str(s) for s in strengths)}")

    entry = PipelineEntry(
        user_id=user_id,
        university_id=uni.id,
        status="shortlisted",
        fit_score=ai.get("fit_score"),
        fit_analysis=ai.get("recommendation"),
        fit_gaps=json.dumps(fit_gaps_list),
        motivation_letter=ai.get("motivation_letter"),
        checklist=json.dumps(checklist),
        deadline_note=deadline,
    )
    try:
        db.add(entry)
        db.commit()
        db.refresh(entry)
    except IntegrityError:
        db.rollback()
        raise ValueError("duplicate")

    # Auto-sync deadline to calendar_events — only when we can honestly
    # resolve it to a real calendar date. Real deadline text is often
    # freetext with no year or multiple intake dates ("July 15 (winter),
    # January 15 (summer)"), which is NOT a valid timestamp — inserting it
    # raw used to 500 the whole pipeline creation and poison the DB session
    # for the rest of the request (the bare except never rolled back).
    if deadline:
        try:
            from datetime import timezone
            if hasattr(deadline, "year") and not hasattr(deadline, "hour"):
                deadline_dt = datetime.combine(deadline, datetime.min.time()).replace(tzinfo=timezone.utc)
            elif hasattr(deadline, "hour"):
                deadline_dt = deadline
            else:
                parsed = parse_deadline(str(deadline))
                deadline_dt = (
                    datetime.combine(date.fromisoformat(parsed["next_date"]), datetime.min.time()).replace(tzinfo=timezone.utc)
                    if parsed["parseable"] else None
                )

            if deadline_dt:
                exists = db.query(CalendarEvent).filter(
                    CalendarEvent.user_id == user_id,
                    CalendarEvent.university_name == uni.name,
                    CalendarEvent.source == "pipeline",
                ).first()
                if not exists:
                    cal = CalendarEvent(
                        user_id=user_id,
                        title=f"Application deadline — {uni.name}",
                        event_date=deadline_dt,
                        event_type="deadline",
                        university_name=uni.name,
                        source="pipeline",
                    )
                    db.add(cal)
                    db.commit()
        except Exception:
            db.rollback()  # never leave the session poisoned for the rest of the request

    return entry


@router.post("", status_code=201)
@limiter.limit("20/minute")
def add_to_pipeline(
    request: Request,
    body: PipelineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        entry = create_pipeline_entry(db, current_user.id, body.university_id)
    except ValueError as e:
        if str(e) == "not_found":
            raise HTTPException(status_code=404, detail="University not found")
        raise HTTPException(status_code=409, detail="Already in your pipeline")

    owned_types, degree_level, profile = _readiness_context(db, current_user.id)
    return _entry_to_out(entry, owned_types, degree_level, profile)


@router.patch("/{entry_id}")
def update_entry(
    entry_id: int,
    body: PipelineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(PipelineEntry).filter(
        PipelineEntry.id == entry_id,
        PipelineEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status")
        # Students cannot manually set status to "decision" — that's admin-only
        if body.status == "decision":
            raise HTTPException(status_code=403, detail="Status 'decision' is set by admin only")
        entry.status = body.status
    if body.notes is not None:
        entry.notes = body.notes
    if body.motivation_letter is not None:
        entry.motivation_letter = body.motivation_letter
    if body.checklist is not None:
        entry.checklist = json.dumps(body.checklist)
    if body.deadline_note is not None:
        entry.deadline_note = body.deadline_note

    db.commit()
    db.refresh(entry)
    owned_types, degree_level, profile = _readiness_context(db, current_user.id)
    return _entry_to_out(entry, owned_types, degree_level, profile)


@router.post("/{entry_id}/regenerate")
@limiter.limit("5/minute")
def regenerate_analysis(
    request: Request,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(PipelineEntry).filter(
        PipelineEntry.id == entry_id,
        PipelineEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    uni = entry.university
    ai = _run_ai_analysis(profile, uni)
    if not ai:
        raise HTTPException(status_code=502, detail="AI analysis failed")

    strengths = ai.get("strengths") or []
    gaps = ai.get("gaps") or []
    fit_gaps_list = list(gaps)
    if strengths:
        fit_gaps_list.append(f"Strengths: {', '.join(str(s) for s in strengths)}")

    entry.fit_score = ai.get("fit_score")
    entry.fit_analysis = ai.get("recommendation")
    entry.fit_gaps = json.dumps(fit_gaps_list)
    entry.motivation_letter = ai.get("motivation_letter")
    db.commit()
    db.refresh(entry)
    owned_types, degree_level, profile = _readiness_context(db, current_user.id)
    return _entry_to_out(entry, owned_types, degree_level, profile)


@router.delete("/{entry_id}", status_code=204)
def remove_from_pipeline(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(PipelineEntry).filter(
        PipelineEntry.id == entry_id,
        PipelineEntry.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()


# ── Admin-only endpoints ──────────────────────────────────────────────────────

@router.get("/admin/all", dependencies=[Depends(require_admin)])
def admin_list_all(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """Admin: view all pipeline entries across all students."""
    entries = (
        db.query(PipelineEntry)
        .order_by(PipelineEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(PipelineEntry).count()
    return {"items": [_entry_to_out(e) for e in entries], "total": total}


@router.patch("/admin/{entry_id}/decision", dependencies=[Depends(require_admin)])
def admin_set_decision(
    entry_id: int,
    body: AdminDecisionUpdate,
    db: Session = Depends(get_db),
):
    """Admin: set accepted / rejected / waitlisted for a student's pipeline entry."""
    entry = db.query(PipelineEntry).filter(PipelineEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    if body.decision is not None:
        if body.decision not in VALID_DECISIONS:
            raise HTTPException(status_code=422, detail=f"Invalid decision. Must be one of: {', '.join(VALID_DECISIONS)}")
        entry.decision = body.decision
        entry.status = "decision"
    else:
        # Clearing the decision — move back to submitted
        entry.decision = None
        entry.status = "submitted"

    if body.admin_note is not None:
        # Append admin note to existing notes
        existing = entry.notes or ""
        prefix = f"[Admin] {body.admin_note}"
        entry.notes = f"{prefix}\n\n{existing}".strip() if existing else prefix

    db.commit()
    db.refresh(entry)
    return _entry_to_out(entry)
