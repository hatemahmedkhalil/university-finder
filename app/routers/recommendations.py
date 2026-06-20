from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation import build_criteria, get_recommender

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse)
def get_recommendations(
    payload: RecommendationRequest,
    top_n: int = Query(default=10, ge=1, le=50, description="Max results to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return universities ranked by compatibility with the current user's profile.
    Any field in the request body overrides the saved profile for this request only.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Create one at POST /profiles before requesting recommendations.",
        )

    universities = db.query(University).all()
    if not universities:
        return RecommendationResponse(results=[], total=0)

    criteria = build_criteria(profile, payload.model_dump(exclude_unset=True))
    recommender = get_recommender()
    matches = recommender.recommend(criteria, universities)

    top = matches[:top_n]
    return RecommendationResponse(results=top, total=len(matches))
