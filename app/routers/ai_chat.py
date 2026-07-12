import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from groq import Groq

logger = logging.getLogger("university_finder")

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_db, get_current_user, require_admin
from app.models.ai_chat_message import AiChatMessage
from app.models.user import User
from app.models.instructor import Instructor
from app.models.university import University
from app.models.scholarship import Scholarship
from app.models.subscription_plan import SubscriptionPlan
from app.models.student_profile import StudentProfile

import json

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

DAILY_MESSAGE_LIMIT = 30

BASE_PROMPT = """You are UniFind AI, the official smart assistant of the UniFind platform.

UniFind is a SaaS platform that helps students (mainly from Arab countries) find and apply to universities in Europe — especially Germany, Poland, Austria, and the Netherlands.

== PLATFORM FEATURES ==
- University search & filtering by country, language, tuition, ranking
- Scholarship discovery and matching
- Rule-based recommendation engine (matches students to universities based on their profile)
- Favourites list to save universities
- Application tracker (track application status: pending, accepted, rejected, waitlisted)
- Language Learning Center with placement tests and courses for English, German, and Polish
- Language Instructors — certified teachers students can message directly with questions
- Support ticket system — students open tickets, admins reply
- Notification system — real-time alerts for application updates, support replies
- AI Chat (this feature) — available for Premium plan only
- Pricing plans — Free and Premium

== HOW TO USE THE PLATFORM ==
- Register at /register, log in at /login
- Fill your profile at /profile (GPA, budget, preferred country, language level, field of study)
- Get recommendations at /recommendations
- Browse universities at /universities
- Browse scholarships at /scholarships
- Track applications at /applications
- Message instructors at /instructors
- Take placement tests at /learning

{app_data}

== YOUR ROLE ==
- Answer questions about the platform's features and how to use them
- Help students choose the right universities and scholarships based on their situation
- Give advice about studying in Europe (visa, language requirements, documents, costs)
- Be friendly, clear, and specific
- If you don't know something, say so honestly
- Always remind students to verify important details directly with the university

== VERY IMPORTANT RULES ==
- NEVER say "according to the data", "based on the data", "the data shows", "from the data I have" or any similar phrase
- NEVER mention that you received data or that information was provided to you
- Just answer naturally and directly as if you simply know this information
- Speak like a knowledgeable friend, not like a system reading a database
- Bad example: "According to the data I have, there is 1 instructor: Mr. Hatem"
- Good example: "We have one English instructor on the platform — Mr. Hatem. You can message him directly!"
"""


def _build_app_data(db: Session, current_user: User) -> str:
    """Fetch live data from DB and format it for the system prompt."""
    sections = []

    # Subscription plans
    try:
        plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    except Exception:
        plans = []
    if plans:
        lines = ["== SUBSCRIPTION PLANS =="]
        for p in plans:
            features = []
            if p.features:
                try:
                    features = json.loads(p.features)
                except Exception:
                    features = [p.features]
            price = f"${p.price}/month" if p.price else "Free"
            lines.append(f"- {p.name} ({price}): {p.description or ''}")
            for f in features:
                lines.append(f"  • {f}")
        sections.append("\n".join(lines))

    # Universities (top 20)
    universities = db.query(University).limit(20).all()
    if universities:
        lines = ["== UNIVERSITIES ON THE PLATFORM =="]
        for u in universities:
            parts = [f"- {u.name} ({u.country})"]
            if u.city:
                parts.append(f"City: {u.city}")
            if u.ranking:
                parts.append(f"Ranking: #{u.ranking}")
            if u.tuition_fee_eur is not None:
                parts.append(f"Tuition: €{u.tuition_fee_eur}/yr")
            if u.english_programs_available:
                parts.append("Has English programs")
            if u.min_gpa:
                parts.append(f"Min GPA: {u.min_gpa}")
            if u.application_deadline:
                parts.append(f"Deadline: {u.application_deadline}")
            lines.append(" | ".join(parts))
        sections.append("\n".join(lines))

    # Scholarships (top 15)
    scholarships = db.query(Scholarship).limit(15).all()
    if scholarships:
        lines = ["== SCHOLARSHIPS ON THE PLATFORM =="]
        for s in scholarships:
            parts = [f"- {s.name}"]
            if s.provider:
                parts.append(f"by {s.provider}")
            if s.amount_eur:
                parts.append(f"Amount: €{s.amount_eur}")
            if s.deadline:
                parts.append(f"Deadline: {s.deadline}")
            if s.description:
                parts.append(s.description[:120])
            lines.append(" | ".join(parts))
        sections.append("\n".join(lines))

    # Instructors
    instructors = db.query(Instructor).filter(Instructor.is_published == True).all()
    if instructors:
        lines = ["== LANGUAGE INSTRUCTORS =="]
        for i in instructors:
            parts = [f"- {i.title or ''} {i.name}".strip()]
            if i.language:
                parts.append(f"Language: {i.language.capitalize()}")
            if i.specialty:
                parts.append(f"Specialties: {i.specialty}")
            if i.organization:
                parts.append(f"Organization: {i.organization}")
            if i.years_experience:
                parts.append(f"{i.years_experience} yrs experience")
            lines.append(" | ".join(parts))
        sections.append("\n".join(lines))

    # Student's own profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        lines = ["== CURRENT STUDENT PROFILE =="]
        fields = {
            "Nationality": profile.nationality,
            "Degree level": profile.degree_level,
            "GPA": profile.gpa,
            "Budget (EUR/yr)": profile.budget_eur,
            "Preferred countries": profile.preferred_countries,
            "Field of study": profile.field_of_study,
            "English level": profile.english_level,
            "Language": profile.language,
        }
        for k, v in fields.items():
            if v is not None and v != "":
                lines.append(f"- {k}: {v}")
        sections.append("\n".join(lines))

    return "\n\n".join(sections)


def _check_premium(user: User):
    pass  # temporarily open to all users


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


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    model_config = {"from_attributes": True}


class UserPlanOut(BaseModel):
    plan: str
    model_config = {"from_attributes": True}


@router.get("/me", response_model=UserPlanOut)
def get_my_plan(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/history", response_model=list[ChatMessageOut])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_premium(current_user)
    try:
        return (
            db.query(AiChatMessage)
            .filter(AiChatMessage.user_id == current_user.id)
            .order_by(AiChatMessage.created_at.asc())
            .limit(100)
            .all()
        )
    except Exception as e:
        logger.error("Failed to load chat history: %s", e)
        return []


@router.post("/message", response_model=ChatMessageOut)
@limiter.limit("20/minute")
def send_message(
    request: Request,
    body: ChatIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_premium(current_user)

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service is not configured yet.")

    try:
        today_count = _count_today_messages(db, current_user.id)
    except Exception as e:
        logger.error("Failed to count today messages: %s", e)
        today_count = 0
    if today_count >= DAILY_MESSAGE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit of {DAILY_MESSAGE_LIMIT} messages reached. Try again tomorrow."
        )

    # Build dynamic system prompt with live app data
    try:
        app_data = _build_app_data(db, current_user)
    except Exception as e:
        logger.error("Failed to build app data for AI chat: %s", e)
        app_data = ""
    system_prompt = BASE_PROMPT.format(app_data=app_data)

    # Load last 10 exchanges for context
    try:
        history = (
            db.query(AiChatMessage)
            .filter(AiChatMessage.user_id == current_user.id)
            .order_by(AiChatMessage.created_at.desc())
            .limit(20)
            .all()
        )
        history.reverse()
    except Exception as e:
        logger.error("Failed to load chat history: %s", e)
        history = []

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": body.message.strip()})

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        ai_reply = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error("AI chat error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable.")

    # Save both messages to DB
    try:
        user_msg = AiChatMessage(user_id=current_user.id, role="user", content=body.message.strip())
        ai_msg = AiChatMessage(user_id=current_user.id, role="assistant", content=ai_reply)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
    except Exception as e:
        logger.error("Failed to save AI chat messages: %s", e)
        db.rollback()
        return ChatMessageOut(id=0, role="assistant", content=ai_reply, created_at=datetime.utcnow())
    return ai_msg


@router.delete("/history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_premium(current_user)
    db.query(AiChatMessage).filter(AiChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"ok": True}


# ── Admin: upgrade/downgrade user plan ───────────────────────────────────────

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
        raise HTTPException(status_code=404, detail="User not found")
    user.plan = body.plan
    db.commit()
    return {"id": user_id, "plan": user.plan}
