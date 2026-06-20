from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.favourite import Favourite
from app.models.university import University
from app.models.user import User
from app.schemas.university import UniversityOut

router = APIRouter(prefix="/favourites", tags=["Favourites"])


@router.get("", response_model=list[UniversityOut])
def list_favourites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favs = db.query(Favourite).filter(Favourite.user_id == current_user.id).all()
    uni_ids = [f.university_id for f in favs]
    if not uni_ids:
        return []
    return db.query(University).filter(University.id.in_(uni_ids)).all()


@router.post("/{university_id}", status_code=status.HTTP_201_CREATED)
def add_favourite(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.get(University, university_id):
        raise HTTPException(status_code=404, detail="University not found")
    existing = (
        db.query(Favourite)
        .filter(Favourite.user_id == current_user.id, Favourite.university_id == university_id)
        .first()
    )
    if existing:
        return {"message": "Already in favourites"}
    db.add(Favourite(user_id=current_user.id, university_id=university_id))
    db.commit()
    return {"message": "Added to favourites"}


@router.delete("/{university_id}", status_code=status.HTTP_200_OK)
def remove_favourite(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = (
        db.query(Favourite)
        .filter(Favourite.user_id == current_user.id, Favourite.university_id == university_id)
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favourites")
    db.delete(fav)
    db.commit()
    return {"message": "Removed from favourites"}
