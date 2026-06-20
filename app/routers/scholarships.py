from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.models.scholarship import Scholarship, ScholarshipType
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.scholarship import ScholarshipCreate, ScholarshipOut, ScholarshipUpdate

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


@router.get("", response_model=PaginatedResponse[ScholarshipOut])
def list_scholarships(
    university_id: int | None = Query(default=None),
    scholarship_type: ScholarshipType | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Scholarship)
    if university_id is not None:
        q = q.filter(Scholarship.university_id == university_id)
    if scholarship_type is not None:
        q = q.filter(Scholarship.scholarship_type == scholarship_type)
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{scholarship_id}", response_model=ScholarshipOut)
def get_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    return scholarship


@router.post("", response_model=ScholarshipOut, status_code=status.HTTP_201_CREATED)
def create_scholarship(
    payload: ScholarshipCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = Scholarship(**payload.model_dump())
    db.add(scholarship)
    db.commit()
    db.refresh(scholarship)
    return scholarship


@router.patch("/{scholarship_id}", response_model=ScholarshipOut)
def update_scholarship(
    scholarship_id: int,
    payload: ScholarshipUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(scholarship, field, value)
    db.commit()
    db.refresh(scholarship)
    return scholarship


@router.delete("/{scholarship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    db.delete(scholarship)
    db.commit()
