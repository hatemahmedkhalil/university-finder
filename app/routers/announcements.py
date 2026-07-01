from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Table, Column, Integer, DateTime, ForeignKey, func, text
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database import Base, engine
from app.dependencies import get_db, get_current_user, require_admin
from app.models.announcement import Announcement
from app.models.user import User

router = APIRouter(prefix="/announcements", tags=["Announcements"])

# ── read-tracking join table (lightweight, no ORM model needed) ──────────────
announcement_reads = Table(
    "announcement_reads", Base.metadata,
    Column("user_id",         Integer, ForeignKey("users.id",         ondelete="CASCADE"), primary_key=True),
    Column("announcement_id", Integer, ForeignKey("announcements.id", ondelete="CASCADE"), primary_key=True),
    Column("read_at", DateTime, server_default=func.now()),
    extend_existing=True,
)


class AnnouncementOut(BaseModel):
    id: int
    title: str
    body: str
    type: str
    is_published: bool
    is_read: bool = False
    created_at: datetime
    model_config = {"from_attributes": True}


class AnnouncementIn(BaseModel):
    title: str
    body: str
    type: str = "info"
    is_published: bool = True
    target_user_id: Optional[int] = None


# ── helpers ──────────────────────────────────────────────────────────────────

def _read_ids(db: Session, user_id: int) -> set[int]:
    rows = db.execute(
        announcement_reads.select().where(announcement_reads.c.user_id == user_id)
    ).fetchall()
    return {r.announcement_id for r in rows}


def _mark(db: Session, user_id: int, ann_id: int):
    exists = db.execute(
        announcement_reads.select().where(
            announcement_reads.c.user_id == user_id,
            announcement_reads.c.announcement_id == ann_id,
        )
    ).first()
    if not exists:
        db.execute(announcement_reads.insert().values(user_id=user_id, announcement_id=ann_id))
        db.commit()


# ── public (auth required) ───────────────────────────────────────────────────

def _visible_filter(query, current_user):
    """Return only announcements that are public OR targeted at this user."""
    from sqlalchemy import or_
    return query.filter(
        Announcement.is_published == True,
        or_(
            Announcement.target_user_id == None,
            Announcement.target_user_id == current_user.id,
        ),
    )


@router.get("", response_model=list[AnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        _visible_filter(db.query(Announcement), current_user)
        .order_by(Announcement.created_at.desc())
        .all()
    )
    read = _read_ids(db, current_user.id)
    result = []
    for ann in items:
        out = AnnouncementOut.model_validate(ann)
        out.is_read = ann.id in read
        result.append(out)
    return result


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = _visible_filter(db.query(Announcement), current_user).count()
    read  = len(_read_ids(db, current_user.id))
    return {"count": max(0, total - read)}


@router.post("/{ann_id}/read")
def mark_as_read(
    ann_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id, Announcement.is_published == True).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    _mark(db, current_user.id, ann_id)
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(Announcement).filter(Announcement.is_published == True).all()
    for ann in items:
        _mark(db, current_user.id, ann.id)
    return {"ok": True, "marked": len(items)}


@router.get("/{ann_id}", response_model=AnnouncementOut)
def get_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    out = AnnouncementOut.model_validate(ann)
    out.is_read = ann_id in _read_ids(db, current_user.id)
    return out


# ── admin write ───────────────────────────────────────────────────────────────

@router.post("", response_model=AnnouncementOut)
def create_announcement(
    body: AnnouncementIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ann = Announcement(**body.model_dump())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    out = AnnouncementOut.model_validate(ann)
    out.is_read = False
    return out


@router.patch("/{ann_id}", response_model=AnnouncementOut)
def update_announcement(
    ann_id: int,
    body: AnnouncementIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ann, k, v)
    db.commit()
    db.refresh(ann)
    out = AnnouncementOut.model_validate(ann)
    out.is_read = False
    return out


@router.delete("/{ann_id}")
def delete_announcement(
    ann_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"id": ann_id}
