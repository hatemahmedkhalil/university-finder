from pydantic import BaseModel, Field

from app.models.student_profile import DegreeLevel, EnglishLevel
from app.schemas.university import UniversityOut


class RecommendationRequest(BaseModel):
    """
    Allows callers to override profile fields ad-hoc without saving them.
    All fields are optional — omitted fields fall back to the saved profile.
    """
    gpa: float | None = Field(default=None, ge=0.0, le=4.0)
    budget_eur: int | None = Field(default=None, ge=0)
    degree_level: DegreeLevel | None = None
    english_level: EnglishLevel | None = None
    preferred_countries: str | None = None


class ScoreBreakdown(BaseModel):
    country_match: float
    budget_fit: float
    english_fit: float
    gpa_fit: float


class UniversityMatch(BaseModel):
    university: UniversityOut
    score: float = Field(description="Compatibility score 0–100")
    breakdown: ScoreBreakdown
    reasons: list[str]

    model_config = {"from_attributes": True}


class RecommendationResponse(BaseModel):
    results: list[UniversityMatch]
    total: int
