from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.common import PaginatedResponse
from pydantic import BaseModel
from datetime import datetime


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime | None

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserOut])
def list_users(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(User.email.ilike(f"%{search}%"))
    if role:
        q = q.filter(User.role == role)
    total = q.count()
    items = q.order_by(User.id.desc()).offset(skip).limit(limit).all()
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.get(User, user_id)
    return user
