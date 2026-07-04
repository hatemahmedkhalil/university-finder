import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.dependencies import get_db, require_admin, get_current_user
from app.models.instructor import Instructor
from app.models.user import User
from app.services import storage

PHOTO_BUCKET = "instructor-photos"

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/instructors", tags=["Instructors"])


class InstructorOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    title: Optional[str] = None
    language: str
    specialty: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    years_experience: Optional[int] = None
    is_published: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class InstructorIn(BaseModel):
    user_id: Optional[int] = None
    name: str
    title: Optional[str] = None
    language: str
    specialty: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None
    years_experience: Optional[int] = None
    is_published: bool = True


@router.get("", response_model=list[InstructorOut])
def list_instructors(
    language: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Instructor).filter(Instructor.is_published == True)
    if language:
        q = q.filter(Instructor.language == language.lower())
    return q.order_by(Instructor.language, Instructor.name).all()


@router.get("/{instructor_id}", response_model=InstructorOut)
def get_instructor(instructor_id: int, db: Session = Depends(get_db)):
    inst = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return inst


@router.post("", response_model=InstructorOut)
def create_instructor(
    body: InstructorIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    inst = Instructor(**body.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


@router.patch("/{instructor_id}", response_model=InstructorOut)
def update_instructor(
    instructor_id: int,
    body: InstructorIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inst = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor not found")
    is_own = inst.user_id == current_user.id or current_user.role == "instructor" and db.query(Instructor).filter(Instructor.user_id == current_user.id, Instructor.id == instructor_id).first()
    if current_user.role != "admin" and not is_own:
        raise HTTPException(status_code=403, detail="Forbidden")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(inst, k, v)
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/{instructor_id}/photo")
@router.post("/{instructor_id}/upload-photo")
def upload_photo(
    instructor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inst = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor not found")
    if current_user.role != "admin" and inst.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are allowed")

    contents = file.file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 5 MB)")

    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"
    filename = f"{instructor_id}/{uuid.uuid4().hex}{ext}"

    # Delete old photo from storage
    if inst.photo_url and inst.photo_url.startswith("supabase:"):
        old_key = inst.photo_url.removeprefix("supabase:")
        try:
            storage.delete(PHOTO_BUCKET, old_key)
        except Exception:
            pass

    storage.upload(PHOTO_BUCKET, filename, contents, file.content_type or "image/jpeg")
    photo_url = storage.public_url(PHOTO_BUCKET, filename)

    inst.photo_url = photo_url
    db.commit()
    return {"photo_url": photo_url}


@router.delete("/{instructor_id}")
def delete_instructor(
    instructor_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    inst = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor not found")
    db.delete(inst)
    db.commit()
    return {"id": instructor_id}
