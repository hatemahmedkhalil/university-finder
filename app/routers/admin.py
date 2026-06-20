from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.favourite import Favourite
from app.models.scholarship import Scholarship
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
        "users_by_role": {r: c for r, c in roles},
        "top_favourited_universities": [{"name": name, "count": count} for name, count in top_favs],
    }
