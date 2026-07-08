from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_db, require_admin
from app.models.announcement import Announcement
from app.models.application import Application
from app.models.favourite import Favourite
from app.models.learning import Course
from app.models.scholarship import Scholarship
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_universities = db.query(func.count(University.id)).scalar()
    total_scholarships = db.query(func.count(Scholarship.id)).scalar()
    total_favourites = db.query(func.count(Favourite.id)).scalar()
    total_courses = db.query(func.count(Course.id)).scalar()
    total_announcements = db.query(func.count(Announcement.id)).scalar()
    total_applications = db.query(func.count(Application.id)).scalar()

    # Top 5 most favourited universities
    top_favs = (
        db.query(University.name, func.count(Favourite.id).label("count"))
        .join(Favourite, Favourite.university_id == University.id)
        .group_by(University.id, University.name)
        .order_by(func.count(Favourite.id).desc())
        .limit(5)
        .all()
    )

    # Users by role
    roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()

    return {
        "total_users": total_users,
        "total_universities": total_universities,
        "total_scholarships": total_scholarships,
        "total_favourites": total_favourites,
        "total_courses": total_courses,
        "total_announcements": total_announcements,
        "total_applications": total_applications,
        "users_by_role": {r: c for r, c in roles},
        "top_favourited_universities": [{"name": name, "count": count} for name, count in top_favs],
    }


@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    students = (
        db.query(User)
        .filter(User.role == "student")
        .options(joinedload(User.profile))
        .order_by(User.id.desc())
        .all()
    )

    result = []
    for u in students:
        p = u.profile
        result.append({
            "id": u.id,
            "email": u.email,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "has_profile": p is not None,
            "nationality": p.nationality if p else None,
            "degree_level": p.degree_level if p else None,
            "gpa": p.gpa if p else None,
            "budget_eur": p.budget_eur if p else None,
            "english_level": p.english_level if p else None,
            "preferred_countries": p.preferred_countries if p else None,
            "field_of_study": p.field_of_study if p else None,
        })
    return result


class UserUpdatePayload(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    plan: Optional[str] = None


@router.get("/users")
def admin_list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).order_by(User.id.desc()).all()
    return [
        {
            "id": u.id, "email": u.email, "role": u.role,
            "plan": u.plan, "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/users/{user_id}")
def admin_get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id, "email": u.email, "role": u.role,
        "plan": u.plan, "is_active": u.is_active,
        "is_verified": u.is_verified,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.patch("/users/{user_id}")
def admin_update_user(user_id: int, payload: UserUpdatePayload, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.is_active is not None:
        u.is_active = payload.is_active
    if payload.role is not None:
        u.role = payload.role
    if payload.plan is not None:
        u.plan = payload.plan
    db.commit()
    db.refresh(u)
    return {"id": u.id, "email": u.email, "role": u.role, "plan": u.plan, "is_active": u.is_active}


@router.delete("/users/{user_id}", status_code=204)
def admin_delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()


class NotificationPayload(BaseModel):
    title: str
    message: str
    type: str = "system"
    user_ids: Optional[list[int]] = None  # None = broadcast to all


@router.post("/notifications/send", status_code=201)
def admin_send_notification(payload: NotificationPayload, db: Session = Depends(get_db), _=Depends(require_admin)):
    if payload.user_ids:
        user_ids = payload.user_ids
    else:
        user_ids = [u.id for u in db.query(User.id).filter(User.role == "student").all()]
    notifs = [
        Notification(user_id=uid, title=payload.title, message=payload.message, type=payload.type)
        for uid in user_ids
    ]
    db.add_all(notifs)
    db.commit()
    return {"sent": len(notifs)}


@router.get("/notifications")
def admin_list_notifications(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(Notification, User.email)
        .join(User, User.id == Notification.user_id)
        .order_by(Notification.id.desc())
        .limit(500)
        .all()
    )
    return [
        {
            "id": n.id, "user_id": n.user_id, "user_email": email,
            "title": n.title, "message": n.message, "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n, email in rows
    ]
