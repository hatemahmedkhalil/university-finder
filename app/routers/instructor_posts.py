from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user, require_admin
from app.models.instructor_post import InstructorPost
from app.models.instructor import Instructor
from app.models.user import User

router = APIRouter(prefix="/instructor-posts", tags=["Instructor Posts"])


class InstructorSnap(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    language: Optional[str] = None
    organization: Optional[str] = None
    photo_url: Optional[str] = None
    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: int
    instructor_id: int
    content: str
    created_at: datetime
    instructor: InstructorSnap
    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    content: str


def get_linked_instructor(current_user: User, db: Session) -> Instructor:
    instr = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
    if not instr:
        raise HTTPException(status_code=403, detail="No instructor profile linked to your account")
    return instr


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PostOut])
def list_all_posts(db: Session = Depends(get_db)):
    return (
        db.query(InstructorPost)
        .order_by(InstructorPost.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/instructor/{instructor_id}", response_model=list[PostOut])
def posts_by_instructor(instructor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(InstructorPost)
        .filter(InstructorPost.instructor_id == instructor_id)
        .order_by(InstructorPost.created_at.desc())
        .all()
    )


# ── Instructor ────────────────────────────────────────────────────────────────

@router.post("", response_model=PostOut)
def create_post(
    body: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    instr = get_linked_instructor(current_user, db)
    post = InstructorPost(instructor_id=instr.id, content=body.content.strip())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(InstructorPost).filter(InstructorPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # Allow instructor to delete own posts, or admin
    if current_user.role != "admin":
        instr = get_linked_instructor(current_user, db)
        if post.instructor_id != instr.id:
            raise HTTPException(status_code=403, detail="Not your post")
    db.delete(post)
    db.commit()
    return {"id": post_id}
