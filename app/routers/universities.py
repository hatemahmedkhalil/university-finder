from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.models.university import University, UniversityDocumentItem
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.university import (
    DocumentItemCreate, DocumentItemOut, DocumentItemUpdate,
    UniversityCreate, UniversityDetail, UniversityOut, UniversityUpdate,
)

router = APIRouter(prefix="/universities", tags=["Universities"])


_GERMAN_COUNTRIES = {"germany", "austria", "switzerland", "liechtenstein"}
_POLISH_COUNTRIES = {"poland"}

@router.get("", response_model=PaginatedResponse[UniversityOut])
def list_universities(
    country: str | None = Query(default=None),
    search: str | None = Query(default=None, description="Substring match on name or city"),
    english_only: bool = Query(default=False),
    language: str | None = Query(default=None, description="Filter by teaching language: english | german | polish"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(University)
    if country:
        q = q.filter(University.country.ilike(f"%{country}%"))
    if search:
        q = q.filter(or_(University.name.ilike(f"%{search}%"), University.city.ilike(f"%{search}%")))
    # language filter (english_only is kept for backward compat)
    lang = (language or "").lower().strip()
    if english_only or lang == "english":
        q = q.filter(University.english_programs_available.is_(True))
    elif lang == "german":
        q = q.filter(or_(*[University.country.ilike(f"%{c}%") for c in _GERMAN_COUNTRIES]))
    elif lang == "polish":
        q = q.filter(or_(*[University.country.ilike(f"%{c}%") for c in _POLISH_COUNTRIES]))
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{university_id}", response_model=UniversityDetail)
def get_university(
    university_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    university = db.get(University, university_id)
    if not university:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    return university


@router.post("", response_model=UniversityOut, status_code=status.HTTP_201_CREATED)
def create_university(
    payload: UniversityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    university = University(**payload.model_dump())
    db.add(university)
    db.commit()
    db.refresh(university)
    return university


@router.patch("/{university_id}", response_model=UniversityOut)
def update_university(
    university_id: int,
    payload: UniversityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    university = db.get(University, university_id)
    if not university:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(university, field, value)
    db.commit()
    db.refresh(university)
    return university


@router.delete("/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    university_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    university = db.get(University, university_id)
    if not university:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    db.delete(university)
    db.commit()


# ── Document checklist endpoints ──────────────────────────────────────────────

@router.get("/{university_id}/documents", response_model=list[DocumentItemOut])
def list_documents(
    university_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    university = db.get(University, university_id)
    if not university:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    return university.document_items


@router.post("/{university_id}/documents", response_model=DocumentItemOut, status_code=status.HTTP_201_CREATED)
def create_document(
    university_id: int,
    payload: DocumentItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    university = db.get(University, university_id)
    if not university:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    item = UniversityDocumentItem(university_id=university_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{university_id}/documents/{doc_id}", response_model=DocumentItemOut)
def update_document(
    university_id: int,
    doc_id: int,
    payload: DocumentItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = db.query(UniversityDocumentItem).filter_by(id=doc_id, university_id=university_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{university_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    university_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = db.query(UniversityDocumentItem).filter_by(id=doc_id, university_id=university_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document item not found")
    db.delete(item)
    db.commit()
