from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.student_profile import StudentProfileCreate, StudentProfileOut, StudentProfileUpdate

router = APIRouter(prefix="/profiles", tags=["Student Profiles"])


@router.post("", response_model=StudentProfileOut, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")
    profile = StudentProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=StudentProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.patch("/me", response_model=StudentProfileOut)
def update_my_profile(
    payload: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    db.delete(profile)
    db.commit()
