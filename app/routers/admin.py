from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db, require_admin
from app.models.announcement import Announcement
from app.models.application import Application
from app.models.favourite import Favourite
from app.models.learning import Course
from app.models.scholarship import Scholarship
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User

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
