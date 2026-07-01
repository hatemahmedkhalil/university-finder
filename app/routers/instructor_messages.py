from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user, require_admin
from app.models.instructor_message import InstructorMessage
from app.models.instructor import Instructor
from app.models.user import User

router = APIRouter(prefix="/instructor-messages", tags=["Instructor Messages"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserSnap(BaseModel):
    id: int
    email: str
    model_config = {"from_attributes": True}


class InstructorSnap(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    language: Optional[str] = None
    organization: Optional[str] = None
    photo_url: Optional[str] = None
    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    instructor_id: int
    user_id: int
    question: str
    reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: datetime
    instructor: InstructorSnap
    user: UserSnap
    model_config = {"from_attributes": True}


class AskQuestion(BaseModel):
    question: str


class ReplyBody(BaseModel):
    reply: str


# ── Student endpoints ─────────────────────────────────────────────────────────

@router.post("/instructors/{instructor_id}", response_model=MessageOut)
def ask_question(
    instructor_id: int,
    body: AskQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    instr = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not instr:
        raise HTTPException(status_code=404, detail="Instructor not found")

    msg = InstructorMessage(
        instructor_id=instructor_id,
        user_id=current_user.id,
        question=body.question.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    # Re-query to ensure relationships (instructor, user) are loaded
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg.id).first()
    return msg


@router.get("/instructors/{instructor_id}", response_model=list[MessageOut])
def get_my_messages_with_instructor(
    instructor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(InstructorMessage)
        .filter(
            InstructorMessage.instructor_id == instructor_id,
            InstructorMessage.user_id == current_user.id,
        )
        .order_by(InstructorMessage.created_at.asc())
        .all()
    )


@router.get("/my", response_model=list[MessageOut])
def get_all_my_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(InstructorMessage)
        .filter(InstructorMessage.user_id == current_user.id)
        .order_by(InstructorMessage.created_at.desc())
        .all()
    )


# ── Instructor endpoints ──────────────────────────────────────────────────────

def get_instructor_profile(current_user: User, db: Session) -> Instructor:
    """Returns the instructor profile linked to this user, or raises 403."""
    instr = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instr:
        raise HTTPException(status_code=403, detail="No instructor profile linked to your account")
    return instr


@router.get("/inbox", response_model=list[MessageOut])
def instructor_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Instructor sees all messages sent to them."""
    instr = get_instructor_profile(current_user, db)
    return (
        db.query(InstructorMessage)
        .filter(InstructorMessage.instructor_id == instr.id)
        .order_by(InstructorMessage.created_at.desc())
        .all()
    )


@router.post("/inbox/{msg_id}/reply", response_model=MessageOut)
def instructor_reply(
    msg_id: int,
    body: ReplyBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Instructor replies to a message addressed to them."""
    instr = get_instructor_profile(current_user, db)
    msg = db.query(InstructorMessage).filter(
        InstructorMessage.id == msg_id,
        InstructorMessage.instructor_id == instr.id,
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.reply = body.reply.strip()
    msg.replied_at = datetime.utcnow()
    db.commit()
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg_id).first()
    return msg


@router.get("/stats", response_model=dict)
def get_instructor_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns dashboard stats for the logged-in instructor."""
    instr = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instr:
        raise HTTPException(status_code=403, detail="Not an instructor")

    all_msgs = db.query(InstructorMessage).filter(InstructorMessage.instructor_id == instr.id).all()
    total_students = len({m.student_id for m in all_msgs})
    pending_replies = sum(1 for m in all_msgs if not m.reply)
    total_messages = len(all_msgs)

    # courses in the instructor's language
    from app.models.learning import Course
    courses = db.query(Course).filter(
        Course.language == instr.language,
        Course.is_published == True,
    ).all()

    return {
        "total_students": total_students,
        "total_messages": total_messages,
        "pending_replies": pending_replies,
        "courses_count": len(courses),
        "courses": [{"id": c.id, "title": c.title, "level": c.level} for c in courses],
        "language": instr.language,
        "instructor_name": instr.name.strip(),
    }


@router.get("/profile", response_model=dict)
def get_my_instructor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the instructor profile for the logged-in user (if any)."""
    instr = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instr:
        return {}
    return {
        "id": instr.id,
        "name": instr.name,
        "title": instr.title,
        "language": instr.language,
        "organization": instr.organization,
        "photo_url": instr.photo_url,
        "specialty": instr.specialty,
        "bio": instr.bio,
        "email": instr.email,
        "years_experience": instr.years_experience,
    }


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("", response_model=list[MessageOut])
def admin_list_all(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(InstructorMessage).order_by(InstructorMessage.created_at.desc()).all()


@router.get("/{msg_id}", response_model=MessageOut)
def admin_get_one(
    msg_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.post("/{msg_id}/reply", response_model=MessageOut)
def admin_reply(
    msg_id: int,
    body: ReplyBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.reply = body.reply.strip()
    msg.replied_at = datetime.utcnow()
    db.commit()
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg_id).first()
    return msg


@router.delete("/{msg_id}")
def admin_delete(
    msg_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    msg = db.query(InstructorMessage).filter(InstructorMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"id": msg_id}
