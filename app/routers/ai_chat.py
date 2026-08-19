import json
import logging
from datetime import datetime, date
from typing import Optional
import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.services.ai_client import achat_completion, ai_configured

logger = logging.getLogger("university_finder")

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_db, get_current_user, require_admin
from app.models.ai_chat_message import AiChatMessage
from app.models.user import User
from app.models.instructor import Instructor
from app.models.university import University
from app.models.scholarship import Scholarship
from app.models.student_profile import StudentProfile
from app.models.pipeline import PipelineEntry
from app.models.student_document import StudentDocument
from app.services.application_readiness import (
    build_requirements, compute_readiness, parse_deadline,
    compute_deadline_risk, compute_profile_completeness, compute_submission_readiness,
)

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

DAILY_MESSAGE_LIMIT = 30
FREE_DAILY_MSG_LIMIT = 10

# ── System prompt ─────────────────────────────────────────────────────────────

BASE_PROMPT = """You are UniAdvisor, the personal AI study-abroad advisor inside UniFind.

UniFind helps Arab students apply to universities in Germany, Poland, and Romania.

== YOUR PERSONALITY ==
- You are the student's personal advisor — you know them deeply and speak to them by name when you have it
- Warm, encouraging, and direct — like a knowledgeable older sibling who studied in Europe
- Proactive: if you see a risk or opportunity in their situation, mention it even if they didn't ask
- Never robotic — no bullet-point dumps, no "based on the data" phrases
- Always verify important details with the university directly

== VERY IMPORTANT RULES ==
- NEVER say "according to the data", "based on the data", "the data shows", or "from the data I have"
- Just speak naturally as if you simply know this — because you do, you're their advisor
- If something is missing from their profile, gently ask them about it
- Remember previous conversations — refer back to what they told you before when relevant
- ONLY recommend universities that appear in the UNIVERSITIES list below. NEVER invent or suggest universities not on that list.
- If a student asks about a university not on the list, tell them it's not currently on the platform and suggest the closest match from the list.
- If you have no information about deadlines in the student's context, tell them they have no upcoming deadlines tracked yet and suggest they add some in their pipeline.
- If asked "Am I ready to apply/submit to X?", answer using the SUBMISSION READINESS context below (READY/BLOCKED/DATA_INCOMPLETE/DEADLINE_PASSED) — never compute or guess this yourself. BLOCKED → name the specific missing items. DATA_INCOMPLETE → say the university's requirements aren't fully verified yet, so you can't confidently confirm readiness. NEVER tell a student their application "will be accepted" — you can only say whether it appears ready to submit, not what the university's decision will be.

== UNIVERSITY RECOMMENDATIONS ==
- When recommending universities, always suggest 2-3 DIFFERENT universities, NOT just the one already in the student's pipeline
- Pick universities that match their field, GPA, budget, and target country — show variety
- If a university is already in their pipeline, you can mention it but also suggest new ones
- NEVER offer add_pipeline or add_favorite for a university that is NOT on the UNIVERSITIES list below. If you tell the student a university is not on the platform, do NOT offer any action for it.

== ACTIONS ==
You can offer to perform real actions in the app on the student's behalf. Only offer an action when it is directly relevant to what was just asked — do NOT offer pipeline/calendar actions when the student just asked about their profile, GPA, budget, or English level.

Your response MUST always be valid JSON in this exact format:
{{"message": "<your conversational reply here>", "action": null}}

OR if you want to offer an action:
{{"message": "<your reply ending with 'Want me to [action]?' or 'Should I [action]?'>", "action": {{"type": "<action_type>", "label": "<button text>", "data": {{...}}}}}}

Available action types:
- "add_calendar": Add a date to their calendar. data: {{"title": "...", "event_date": "YYYY-MM-DD", "event_type": "deadline|event|reminder", "university_name": "..." (optional)}}
- "add_pipeline": Add a university to their application pipeline. data: {{"university_name": "exact name from the universities list"}}
- "add_favorite": Save a university to their favourites. data: {{"university_name": "exact name from the universities list"}}
- "remove_pipeline": Remove a university from their application pipeline. data: {{"university_name": "exact name as it appears in their APPLICATION PIPELINE context"}}
- "remove_favorite": Remove a university from their favourites. data: {{"university_name": "exact name as it appears in their SAVED UNIVERSITIES context"}}

Rules for actions:
- Only offer ONE action per message
- Only offer an action when it is DIRECTLY relevant to the question asked. Examples: student asks about a deadline → offer add_calendar. Student asks to add/recommend a university → offer add_pipeline. Student asks what scholarships exist → offer add_calendar for the deadline. Student asks to remove/delete a university → offer remove_pipeline or remove_favorite.
- NEVER offer an action just because you can. If the student asks "what is my GPA?" — answer it, action=null.
- NEVER offer add_pipeline or add_favorite with a university name that is not in the UNIVERSITIES list.
- Only offer remove_pipeline/remove_favorite for a university that actually appears in the student's own APPLICATION PIPELINE or SAVED UNIVERSITIES context — never invent one to remove.
- CRITICAL: YOU HAVE NEVER PERFORMED ANY ACTION. Not even when the student says "yes", "confirm", "do it", "please add it", or similar. You have NO way to execute anything — only the app does, only after the student clicks the action button in THIS message. NEVER say "I've added it", "I've removed it", "Done!", "added it for you", or any past-tense claim of completion — this includes replying to a "yes" confirmation. When the student confirms with "yes"/"please do it", re-offer the SAME action in this message so the button appears again; do not describe it as already done.
- The "label" is the button text shown to the student (e.g. "Add to Calendar", "Remove from Pipeline", "Save University")
- NEVER include markdown in the message field — plain text only
- Return ONLY the JSON object, nothing before or after it

{student_context}

{platform_context}
"""


def _build_student_context(db: Session, user: User) -> str:
    """Build a rich, personal context block for this specific student."""
    sections = []

    # ── Profile ──────────────────────────────────────────────────────────────
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile:
        lines = ["== STUDENT PROFILE =="]
        if profile.full_name:
            lines.append(f"Name: {profile.full_name}")
        lines.append(f"Email: {user.email}")
        fields = {
            "Nationality": profile.nationality,
            "Degree level applying for": profile.degree_level.value if hasattr(profile.degree_level, 'value') else profile.degree_level,
            "GPA": f"{profile.gpa}/4.0" if profile.gpa else None,
            "Previous GPA": f"{profile.prev_gpa}/4.0" if profile.prev_gpa else None,
            "Annual budget (EUR)": f"€{profile.budget_eur:,}" if profile.budget_eur else None,
            "English level": profile.english_level.value if hasattr(profile.english_level, 'value') else profile.english_level,
            "Target language": profile.language,
            "Field of study": profile.field_of_study,
            "Target countries": profile.preferred_countries,
            "Previous university": profile.prev_university,
            "Previous major": profile.prev_major,
            "Graduation year": profile.graduation_year,
        }
        for k, v in fields.items():
            if v is not None and str(v).strip():
                lines.append(f"- {k}: {v}")

        # Placement test results
        if profile.placement_results:
            try:
                pr = json.loads(profile.placement_results) if isinstance(profile.placement_results, str) else profile.placement_results
                if pr:
                    lines.append("- Placement test results: " + ", ".join(f"{lang}: {level}" for lang, level in pr.items()))
            except Exception:
                pass

        sections.append("\n".join(lines))

    # ── Pipeline / Applications ───────────────────────────────────────────────
    try:
        pipeline = db.execute(sa.text("""
            SELECT ap.status, ap.fit_score, ap.fit_gaps, ap.deadline_note, ap.decision,
                   u.name AS uni_name, u.country, u.city
            FROM application_pipeline ap
            JOIN universities u ON u.id = ap.university_id
            WHERE ap.user_id = :uid
            ORDER BY ap.created_at DESC
        """), {"uid": user.id}).fetchall()
    except Exception:
        pipeline = []

    if pipeline:
        lines = [f"== APPLICATION PIPELINE ({len(pipeline)} universities) =="]
        for p in pipeline:
            # Real pipeline stages (VALID_STATUSES) — was previously keyed on
            # "pending"/"accepted"/etc., which are decision values, not
            # statuses, so this icon never actually matched real data.
            status_icon = {
                "shortlisted": "🎯", "preparing": "📝", "ready": "✅",
                "submitted": "📨", "decision": "🏁",
            }.get(p.status, "📋")
            line = f"{status_icon} {p.uni_name} ({p.city}, {p.country}) — Status: {p.status.upper()}"
            if p.fit_score:
                line += f" | Fit score: {p.fit_score}%"
            if p.deadline_note:
                line += f" | Deadline: {p.deadline_note}"
            if p.fit_gaps:
                line += f" | Gaps: {p.fit_gaps}"
            if p.decision:
                line += f" | Decision: {p.decision}"
            lines.append(line)
        sections.append("\n".join(lines))

    # ── Final Submission Check (same shared service Apply Hub uses — no
    # separate readiness calculation here) ─────────────────────────────────────
    try:
        entries = (
            db.query(PipelineEntry)
            .filter(PipelineEntry.user_id == user.id, PipelineEntry.status != "decision")
            .all()
        )
        if entries:
            owned_types = {d.doc_type for d in db.query(StudentDocument).filter(StudentDocument.user_id == user.id).all()}
            degree_level = None
            if profile and profile.degree_level:
                degree_level = profile.degree_level.value if hasattr(profile.degree_level, "value") else str(profile.degree_level)
            personal_info = compute_profile_completeness(profile)

            lines = ["== SUBMISSION READINESS (per application) =="]
            for e in entries:
                requirements = build_requirements(e.university, degree_level, owned_types, bool(e.motivation_letter), profile)
                readiness = compute_readiness(requirements)
                deadline = parse_deadline(e.university.application_deadline)
                deadline_risk = compute_deadline_risk(deadline, readiness)
                check = compute_submission_readiness(requirements, readiness, personal_info, bool(e.motivation_letter), deadline, deadline_risk)
                line = f"{e.university.name}: {check['state']}"
                if check["issues"]:
                    line += " — missing: " + "; ".join(i["label"] for i in check["issues"])
                lines.append(line)
            sections.append("\n".join(lines))
    except Exception:
        pass

    # ── Saved universities (Favourites) ───────────────────────────────────────
    try:
        favs = db.execute(sa.text("""
            SELECT u.name, u.country, u.city, u.tuition_fee_eur, u.ranking
            FROM favourites f
            JOIN universities u ON u.id = f.university_id
            WHERE f.user_id = :uid
            ORDER BY f.created_at DESC
            LIMIT 10
        """), {"uid": user.id}).fetchall()
    except Exception:
        favs = []

    if favs:
        lines = [f"== SAVED UNIVERSITIES ({len(favs)}) =="]
        for f in favs:
            tuition = f"€{f.tuition_fee_eur:,}/yr" if f.tuition_fee_eur else "Free"
            rank = f"#{f.ranking}" if f.ranking else "unranked"
            lines.append(f"- {f.name} ({f.city}, {f.country}) | Rank {rank} | Tuition: {tuition}")
        sections.append("\n".join(lines))

    # ── Test Scores ──────────────────────────────────────────────────────────
    try:
        attempts = db.execute(sa.text("""
            SELECT exam_type, overall_score, score_band, completed_at
            FROM simulator_attempts
            WHERE user_id = :uid AND status = 'completed'
            ORDER BY completed_at DESC
            LIMIT 5
        """), {"uid": user.id}).fetchall()
    except Exception:
        attempts = []

    if attempts:
        lines = ["== EXAM SIMULATOR SCORES =="]
        for a in attempts:
            date_str = a.completed_at.strftime("%b %Y") if a.completed_at else "?"
            score = a.score_band or a.overall_score or "?"
            lines.append(f"- {a.exam_type}: {score} (taken {date_str})")
        sections.append("\n".join(lines))

    # ── Upcoming deadlines ────────────────────────────────────────────────────
    try:
        today = date.today()
        events = db.execute(sa.text("""
            SELECT title, event_date, event_type, university_name
            FROM calendar_events
            WHERE user_id = :uid AND event_date >= :today AND is_done = false
            ORDER BY event_date ASC
            LIMIT 10
        """), {"uid": user.id, "today": today}).fetchall()
    except Exception:
        events = []

    if events:
        lines = ["== UPCOMING DEADLINES & EVENTS =="]
        for e in events:
            ev_date = e.event_date.date() if hasattr(e.event_date, 'date') else e.event_date
            days_left = (ev_date - today).days if ev_date else "?"
            uni = f" ({e.university_name})" if e.university_name else ""
            lines.append(f"- {e.title}{uni}: {ev_date} — {days_left} days away")
        sections.append("\n".join(lines))

    # ── Motivation letters (standalone) with content preview ─────────────────
    try:
        letters = db.execute(sa.text("""
            SELECT university_name, program, content, updated_at
            FROM motivation_letters
            WHERE user_id = :uid
            ORDER BY updated_at DESC
            LIMIT 3
        """), {"uid": user.id}).fetchall()
    except Exception:
        letters = []

    if letters:
        lines = ["== MOTIVATION LETTERS (with content preview) =="]
        for l in letters:
            prog = f" — {l.program}" if l.program else ""
            snippet = (l.content or "")[:2000].replace("\n", " ").strip()
            if len(l.content or "") > 400:
                snippet += "…"
            lines.append(f"- {l.university_name}{prog}:\n  \"{snippet}\"")
        sections.append("\n".join(lines))

    # ── Pipeline letters (AI-generated, stored per application) ──────────────
    try:
        pipe_letters = db.execute(sa.text("""
            SELECT u.name AS university_name, ap.motivation_letter
            FROM application_pipeline ap
            JOIN universities u ON u.id = ap.university_id
            WHERE ap.user_id = :uid AND ap.motivation_letter IS NOT NULL
            ORDER BY ap.updated_at DESC
            LIMIT 3
        """), {"uid": user.id}).fetchall()
    except Exception:
        pipe_letters = []

    if pipe_letters:
        lines = ["== APPLICATION MOTIVATION LETTERS =="]
        for l in pipe_letters:
            snippet = (l.motivation_letter or "")[:2000].replace("\n", " ").strip()
            if len(l.motivation_letter or "") > 400:
                snippet += "…"
            lines.append(f"- {l.university_name}:\n  \"{snippet}\"")
        sections.append("\n".join(lines))

    if not sections:
        return "== STUDENT CONTEXT ==\nThis student has just joined and hasn't filled in their profile yet. Encourage them to complete it at /profile."

    return "\n\n".join(sections)


def _build_platform_context(db: Session) -> str:
    """Platform-wide knowledge: universities, scholarships, instructors."""
    sections = []

    # All universities (key fields only to save tokens)
    try:
        unis = db.execute(sa.text("""
            SELECT name, country, city, ranking, tuition_fee_eur, min_gpa,
                   english_programs_available, application_deadline
            FROM universities ORDER BY ranking ASC NULLS LAST LIMIT 50
        """)).fetchall()
    except Exception:
        unis = []

    if unis:
        lines = [f"== UNIVERSITIES ({len(unis)} shown) =="]
        for u in unis:
            tuition = f"€{u.tuition_fee_eur:,}/yr" if u.tuition_fee_eur else "Free"
            rank = f"#{u.ranking}" if u.ranking else ""
            en = " | Has English programs" if u.english_programs_available else ""
            deadline = f" | Deadline: {u.application_deadline}" if u.application_deadline else ""
            gpa = f" | Min GPA: {u.min_gpa}" if u.min_gpa else ""
            lines.append(f"- {u.name} ({u.city}, {u.country}) {rank} | Tuition: {tuition}{gpa}{en}{deadline}")
        sections.append("\n".join(lines))

    # Scholarships
    try:
        from app.models.scholarship import Scholarship
        scholarships = db.query(Scholarship).limit(20).all()
    except Exception:
        scholarships = []

    if scholarships:
        lines = ["== SCHOLARSHIPS =="]
        for s in scholarships:
            amt = f"€{s.amount_eur}/mo" if s.amount_eur else ""
            deadline = f" | Deadline: {s.deadline}" if s.deadline else ""
            lines.append(f"- {s.name} by {s.provider or '?'}: {amt}{deadline}")
        sections.append("\n".join(lines))

    # Instructors
    try:
        from app.models.instructor import Instructor
        instructors = db.query(Instructor).filter(Instructor.is_published == True).all()
    except Exception:
        instructors = []

    if instructors:
        lines = ["== LANGUAGE INSTRUCTORS =="]
        for i in instructors:
            lines.append(f"- {i.title or ''} {i.name} | {i.language} | {i.specialty or ''}")
        sections.append("\n".join(lines))

    return "\n\n".join(sections)


def _build_system_prompt(db: Session, user: User) -> str:
    student_ctx = _build_student_context(db, user)
    platform_ctx = _build_platform_context(db)
    return BASE_PROMPT.format(student_context=student_ctx, platform_context=platform_ctx)


# ── Rate limiting helpers ─────────────────────────────────────────────────────

def _count_today_messages(db: Session, user_id: int) -> int:
    today = datetime.utcnow().date()
    return (
        db.query(AiChatMessage)
        .filter(
            AiChatMessage.user_id == user_id,
            AiChatMessage.role == "user",
            AiChatMessage.created_at >= datetime(today.year, today.month, today.day),
        )
        .count()
    )


def _check_free_limit(user: User, db: Session):
    if user.plan != "free":
        return
    if _count_today_messages(db, user.id) >= FREE_DAILY_MSG_LIMIT:
        raise HTTPException(
            status_code=403,
            detail=f"Free plan limit: {FREE_DAILY_MSG_LIMIT} messages/day. Upgrade to Pro for unlimited chat.",
        )


def _require_ai_configured():
    if not ai_configured():
        raise HTTPException(status_code=503, detail="AI service is not configured.")


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: Optional[str] = Field(None, max_length=36)

class LetterFeedbackIn(BaseModel):
    content: str = Field(min_length=50, max_length=8000)
    university_name: Optional[str] = None
    program: Optional[str] = None

class ExecuteActionIn(BaseModel):
    type: str = Field(min_length=1, max_length=50)
    data: dict

class ChatMessageOut(BaseModel):
    id: int
    session_id: Optional[str] = None
    role: str
    content: str
    action: Optional[dict] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class UserPlanOut(BaseModel):
    plan: str
    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPlanOut)
def get_my_plan(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return distinct sessions for the sidebar, most recent first."""
    try:
        rows = db.execute(sa.text("""
            SELECT session_id,
                   MIN(content) FILTER (WHERE role = 'user') AS first_message,
                   MAX(created_at) AS last_at
            FROM ai_chat_messages
            WHERE user_id = :uid AND session_id IS NOT NULL
            GROUP BY session_id
            ORDER BY last_at DESC
            LIMIT 20
        """), {"uid": current_user.id}).fetchall()
        return [
            {
                "session_id": r.session_id,
                "title": (r.first_message or "")[:60],
                "last_at": r.last_at.isoformat() if hasattr(r.last_at, "isoformat") else r.last_at,
            }
            for r in rows
        ]
    except Exception as e:
        logger.error("Failed to load sessions: %s", e)
        return []


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        q = db.query(AiChatMessage).filter(AiChatMessage.user_id == current_user.id)
        if session_id:
            q = q.filter(AiChatMessage.session_id == session_id)
        else:
            # Return empty — caller must specify a session
            return []
        return q.order_by(AiChatMessage.id.asc()).limit(100).all()
    except Exception as e:
        logger.error("Failed to load chat history: %s", e)
        return []


@router.get("/context-summary")
def get_context_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a summary of what the AI knows about this student — shown as badges in the UI."""
    summary = {}

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    summary["has_profile"] = profile is not None
    summary["name"] = profile.full_name if profile and profile.full_name else None

    try:
        summary["pipeline_count"] = db.execute(sa.text(
            "SELECT COUNT(*) FROM application_pipeline WHERE user_id = :uid"
        ), {"uid": current_user.id}).scalar()
    except Exception:
        summary["pipeline_count"] = 0

    try:
        summary["favourites_count"] = db.execute(sa.text(
            "SELECT COUNT(*) FROM favourites WHERE user_id = :uid"
        ), {"uid": current_user.id}).scalar()
    except Exception:
        summary["favourites_count"] = 0

    try:
        summary["test_scores_count"] = db.execute(sa.text(
            "SELECT COUNT(*) FROM simulator_attempts WHERE user_id = :uid AND status = 'completed'"
        ), {"uid": current_user.id}).scalar()
    except Exception:
        summary["test_scores_count"] = 0

    try:
        summary["letters_count"] = db.execute(sa.text(
            "SELECT COUNT(*) FROM motivation_letters WHERE user_id = :uid"
        ), {"uid": current_user.id}).scalar()
    except Exception:
        summary["letters_count"] = 0

    try:
        from datetime import date
        today = date.today()
        cal_count = db.execute(sa.text(
            "SELECT COUNT(*) FROM calendar_events WHERE user_id = :uid AND event_date >= :today AND is_done = false"
        ), {"uid": current_user.id, "today": today}).scalar() or 0
        pipe_count = db.execute(sa.text("""
            SELECT COUNT(*) FROM application_pipeline
            WHERE user_id = :uid AND deadline_note IS NOT NULL
            AND deadline_note::date >= :today AND status != 'decision'
        """), {"uid": current_user.id, "today": today}).scalar() or 0
        summary["upcoming_deadlines"] = cal_count + pipe_count
    except Exception:
        summary["upcoming_deadlines"] = 0

    return summary


@router.get("/advisor-insights")
@limiter.limit("10/minute")
async def get_advisor_insights(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Proactive AI briefing for the Dashboard.
    Returns 3-5 short, personalized action items for this student right now.
    """
    _require_ai_configured()

    student_ctx = _build_student_context(db, current_user)

    prompt = f"""You are UniAdvisor, a personal study-abroad advisor. Based on this student's data, generate 3-5 personalized, specific, actionable insights for their dashboard.

{student_ctx}

Rules:
- Each insight is 1-2 sentences (20-40 words). Never shorter.
- Be SPECIFIC: reference real data from the context — use their actual GPA number, actual university names, actual budget, actual English level, actual deadline dates.
- Do NOT write vague generic phrases like "Low GPA" or "Practice English" — instead write "Your GPA of X.X may be below the minimum for most German universities (typically 2.5+). Focus on universities with GPA ≥ X."
- Priority order: (1) deadlines within 30 days, (2) pipeline gaps, (3) profile gaps, (4) tips based on their target country/field
- If pipeline is empty: suggest 2-3 specific universities that match their profile (field, budget, GPA, country)
- If no test scores: mention the specific exam relevant to their target country (IELTS/TOEFL for Germany, etc.)
- Format: JSON array only. Each item MUST have "type", "message", and "link" (an app route).
- Available links: "/universities" (browse/filter unis), "/pipeline" (applications), "/simulators" (IELTS/TOEFL practice), "/scholarships" (find funding), "/profile" (edit profile), "/ai-chat" (ask me anything)
- Example: [{{"type": "warning", "message": "Your GPA of 2.6 is below the 2.5 minimum for competitive German law programs — check universities that accept 2.5+ like Uni Potsdam.", "link": "/universities"}}]
- Types: "warning"=urgent problem, "deadline"=time-sensitive, "tip"=actionable advice, "success"=something going well
- EVERY insight must have a link so the student can act on it immediately
- Return ONLY a valid JSON array, nothing else"""

    try:
        raw = await achat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            temperature=0.4,
        )
        # Extract JSON array
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            insights = json.loads(raw[start:end])
        else:
            insights = []
    except Exception as e:
        logger.error("Advisor insights error for user %s: %s", current_user.id, e)
        insights = [{"type": "tip", "message": "Complete your profile to get personalized advice."}]

    return {"insights": insights}


@router.post("/letter-feedback")
@limiter.limit("5/minute")
async def letter_feedback(
    request: Request,
    body: LetterFeedbackIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI reviews a motivation letter and returns structured feedback."""
    _require_ai_configured()

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    profile_ctx = ""
    if profile:
        profile_ctx = f"Student profile: {profile.degree_level} in {profile.field_of_study}, GPA {profile.gpa}, from {profile.nationality}, English level {profile.english_level}."

    target = ""
    if body.university_name:
        target += f"University: {body.university_name}. "
    if body.program:
        target += f"Program: {body.program}."

    prompt = f"""You are an expert university admissions consultant. Review this motivation letter and give honest, specific feedback.

{profile_ctx}
{target}

MOTIVATION LETTER:
{body.content}

Return ONLY valid JSON in this exact format:
{{
  "score": <integer 1-10>,
  "summary": "<2 sentences: overall assessment>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>", "<specific weakness 3>"],
  "improvements": ["<concrete improvement suggestion 1>", "<concrete improvement suggestion 2>", "<concrete improvement suggestion 3>"],
  "missing_elements": ["<missing element if any>"]
}}"""

    try:
        raw = await achat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.4,
        )
        start = raw.find("{")
        end = raw.rfind("}") + 1
        feedback = json.loads(raw[start:end]) if start >= 0 else {}
    except Exception as e:
        logger.error("Letter feedback error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable.")

    return feedback


@router.post("/execute-action")
def execute_action(
    body: ExecuteActionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute an AI-suggested action (add to calendar, pipeline, favourites)."""
    action_type = body.type
    data = body.data

    if action_type == "add_calendar":
        title = (data.get("title") or "")[:200]
        event_date_str = data.get("event_date", "")
        event_type = data.get("event_type", "deadline")
        university_name = data.get("university_name")

        if not title or not event_date_str:
            raise HTTPException(status_code=400, detail="title and event_date are required for add_calendar")

        try:
            from datetime import date as date_type
            event_date = date_type.fromisoformat(event_date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid event_date format: {event_date_str}. Use YYYY-MM-DD.")

        # Check for duplicate
        existing = db.execute(sa.text(
            "SELECT id FROM calendar_events WHERE user_id=:uid AND title=:title AND event_date=:date"
        ), {"uid": current_user.id, "title": title, "date": event_date}).fetchone()
        if existing:
            return {"ok": True, "message": "Already in your calendar.", "already_existed": True}

        db.execute(sa.text(
            "INSERT INTO calendar_events (user_id, title, event_date, event_type, university_name, source, is_done, created_at) "
            "VALUES (:uid, :title, :date, :etype, :uname, 'ai_chat', false, NOW())"
        ), {"uid": current_user.id, "title": title, "date": event_date, "etype": event_type, "uname": university_name})
        db.commit()
        return {"ok": True, "message": f"Added '{title}' to your calendar."}

    elif action_type == "add_pipeline":
        # Delegates to the one real pipeline-creation path (app.routers.pipeline
        # .create_pipeline_entry) instead of inserting a row directly — that
        # function is what guarantees a valid status, real AI fit analysis,
        # a real checklist, and calendar sync. A raw INSERT here previously
        # created entries with an invalid status ("pending", not one of
        # VALID_STATUSES) that silently disappeared from the Pipeline board.
        from app.routers.pipeline import create_pipeline_entry

        university_name = data.get("university_name", "")
        uni = db.execute(sa.text(
            "SELECT id FROM universities WHERE LOWER(name) = LOWER(:name) LIMIT 1"
        ), {"name": university_name}).fetchone()
        if not uni:
            raise HTTPException(status_code=404, detail=f"University '{university_name}' not found on the platform.")

        try:
            create_pipeline_entry(db, current_user.id, uni.id)
        except ValueError as e:
            if str(e) == "duplicate":
                return {"ok": True, "message": f"{university_name} is already in your pipeline.", "already_existed": True}
            raise HTTPException(status_code=404, detail=f"University '{university_name}' not found on the platform.")

        return {"ok": True, "message": f"Added {university_name} to your pipeline!"}

    elif action_type == "add_favorite":
        university_name = data.get("university_name", "")
        uni = db.execute(sa.text(
            "SELECT id FROM universities WHERE LOWER(name) = LOWER(:name) LIMIT 1"
        ), {"name": university_name}).fetchone()
        if not uni:
            raise HTTPException(status_code=404, detail=f"University '{university_name}' not found on the platform.")

        existing = db.execute(sa.text(
            "SELECT id FROM favourites WHERE user_id=:uid AND university_id=:univ_id"
        ), {"uid": current_user.id, "univ_id": uni.id}).fetchone()
        if existing:
            return {"ok": True, "message": f"{university_name} is already in your favourites.", "already_existed": True}

        db.execute(sa.text(
            "INSERT INTO favourites (user_id, university_id, created_at) VALUES (:uid, :univ_id, NOW())"
        ), {"uid": current_user.id, "univ_id": uni.id})
        db.commit()
        return {"ok": True, "message": f"Saved {university_name} to your favourites!"}

    elif action_type == "remove_pipeline":
        university_name = data.get("university_name", "")
        uni = db.execute(sa.text(
            "SELECT id FROM universities WHERE LOWER(name) = LOWER(:name) LIMIT 1"
        ), {"name": university_name}).fetchone()
        if not uni:
            raise HTTPException(status_code=404, detail=f"University '{university_name}' not found on the platform.")

        existing = db.execute(sa.text(
            "SELECT id FROM application_pipeline WHERE user_id=:uid AND university_id=:univ_id"
        ), {"uid": current_user.id, "univ_id": uni.id}).fetchone()
        if not existing:
            return {"ok": True, "message": f"{university_name} was not in your pipeline.", "already_existed": True}

        db.execute(sa.text(
            "DELETE FROM application_pipeline WHERE user_id=:uid AND university_id=:univ_id"
        ), {"uid": current_user.id, "univ_id": uni.id})
        db.commit()
        return {"ok": True, "message": f"Removed {university_name} from your pipeline."}

    elif action_type == "remove_favorite":
        university_name = data.get("university_name", "")
        uni = db.execute(sa.text(
            "SELECT id FROM universities WHERE LOWER(name) = LOWER(:name) LIMIT 1"
        ), {"name": university_name}).fetchone()
        if not uni:
            raise HTTPException(status_code=404, detail=f"University '{university_name}' not found on the platform.")

        existing = db.execute(sa.text(
            "SELECT id FROM favourites WHERE user_id=:uid AND university_id=:univ_id"
        ), {"uid": current_user.id, "univ_id": uni.id}).fetchone()
        if not existing:
            return {"ok": True, "message": f"{university_name} was not in your favourites.", "already_existed": True}

        db.execute(sa.text(
            "DELETE FROM favourites WHERE user_id=:uid AND university_id=:univ_id"
        ), {"uid": current_user.id, "univ_id": uni.id})
        db.commit()
        return {"ok": True, "message": f"Removed {university_name} from your favourites."}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action type: {action_type}")


@router.post("/message", response_model=ChatMessageOut)
@limiter.limit("20/minute")
async def send_message(
    request: Request,
    body: ChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_free_limit(current_user, db)

    if _count_today_messages(db, current_user.id) >= DAILY_MESSAGE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit of {DAILY_MESSAGE_LIMIT} messages reached. Try again tomorrow."
        )

    _require_ai_configured()

    try:
        system_prompt = _build_system_prompt(db, current_user)
    except Exception as e:
        logger.error("Failed to build system prompt: %s", e)
        system_prompt = BASE_PROMPT.format(student_context="", platform_context="")

    session_id = body.session_id

    # Load this session's messages for in-session memory
    try:
        if session_id:
            history = (
                db.query(AiChatMessage)
                .filter(
                    AiChatMessage.user_id == current_user.id,
                    AiChatMessage.session_id == session_id,
                )
                .order_by(AiChatMessage.id.asc())
                .limit(50)
                .all()
            )
        else:
            history = []
    except Exception as e:
        logger.error("Failed to load chat history: %s", e)
        history = []

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": body.message.strip()})

    try:
        raw = await achat_completion(
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        logger.error("AI chat error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable.")

    # Parse structured response
    ai_action = None
    try:
        parsed = json.loads(raw)
        ai_reply = parsed.get("message", raw)
        ai_action = parsed.get("action") or None
    except Exception:
        ai_reply = raw

    try:
        user_msg = AiChatMessage(user_id=current_user.id, session_id=session_id, role="user", content=body.message.strip())
        ai_msg = AiChatMessage(user_id=current_user.id, session_id=session_id, role="assistant", content=ai_reply)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
    except Exception as e:
        logger.error("Failed to save AI chat messages: %s", e)
        db.rollback()
        return ChatMessageOut(id=0, role="assistant", content=ai_reply, action=ai_action, created_at=datetime.utcnow())

    return ChatMessageOut(
        id=ai_msg.id,
        session_id=ai_msg.session_id,
        role=ai_msg.role,
        content=ai_msg.content,
        action=ai_action,
        created_at=ai_msg.created_at,
    )


@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(AiChatMessage).filter(AiChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True}


# ── Admin ─────────────────────────────────────────────────────────────────────

class SetPlanBody(BaseModel):
    plan: str

@router.patch("/admin/users/{user_id}/plan")
def set_user_plan(
    user_id: int,
    body: SetPlanBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if body.plan not in ("free", "premium"):
        raise HTTPException(status_code=400, detail="plan must be 'free' or 'premium'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.plan = body.plan
    db.commit()
    return {"id": user_id, "plan": user.plan}


@router.post("/admin/run-daily-insights")
def trigger_daily_insights(
    _: User = Depends(require_admin),
):
    """Manually trigger the daily AI insights job (normally runs at 06:00 UTC via scheduler)."""
    from app.services.daily_insights import run_daily_insights
    return run_daily_insights()
