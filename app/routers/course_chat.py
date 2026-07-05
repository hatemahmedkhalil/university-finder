"""Course community chat — any authenticated user can read/post in a course's chat."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.course_chat import CourseChatMessage
from app.models.learning import Course
from app.models.user import User
from app.models.instructor import Instructor

router = APIRouter(prefix="/course-chat", tags=["Course Chat"])


class ChatMessageOut(BaseModel):
    id: int
    course_id: int
    user_id: int
    content: str
    created_at: datetime
    author_email: str
    author_role: str        # "instructor" | "student"
    author_name: str        # display name

    model_config = {"from_attributes": True}


class ChatMessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


def _build_out(msg: CourseChatMessage) -> dict:
    user = msg.user
    inst = next((i for i in (user.instructor_profiles if hasattr(user, "instructor_profiles") else []) if True), None)
    # determine display name and role
    instr = msg._sa_instance_state.session.query(Instructor).filter(Instructor.user_id == user.id).first()
    if instr:
        name = instr.name.strip() if instr.name else user.email.split("@")[0]
        role_label = "instructor"
    else:
        name = user.email.split("@")[0]
        role_label = "student"
    return {
        "id": msg.id,
        "course_id": msg.course_id,
        "user_id": msg.user_id,
        "content": msg.content,
        "created_at": msg.created_at,
        "author_email": user.email,
        "author_role": role_label,
        "author_name": name,
    }


@router.get("/{course_id}", response_model=list[ChatMessageOut])
def get_chat(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.get(Course, course_id)
    if not course or not course.is_published:
        raise HTTPException(status_code=404, detail="Course not found")
    msgs = (
        db.query(CourseChatMessage)
        .filter(CourseChatMessage.course_id == course_id)
        .order_by(CourseChatMessage.created_at.asc())
        .limit(200)
        .all()
    )
    return [_build_out(m) for m in msgs]


@router.post("/{course_id}", response_model=ChatMessageOut, status_code=201)
def post_message(
    course_id: int,
    body: ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.get(Course, course_id)
    if not course or not course.is_published:
        raise HTTPException(status_code=404, detail="Course not found")
    msg = CourseChatMessage(
        course_id=course_id,
        user_id=current_user.id,
        content=body.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _build_out(msg)


@router.delete("/{message_id}/delete")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.get(CourseChatMessage, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    # only author, admin, or a linked instructor can delete
    is_instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if msg.user_id != current_user.id and current_user.role != "admin" and not is_instructor:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(msg)
    db.commit()
    return {"id": message_id}
