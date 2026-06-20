from pydantic import BaseModel, Field

from app.models.student_profile import DegreeLevel, EnglishLevel


class StudentProfileCreate(BaseModel):
    nationality: str
    degree_level: DegreeLevel
    gpa: float = Field(ge=0.0, le=4.0)
    budget_eur: int = Field(ge=0)
    english_level: EnglishLevel
    preferred_countries: str = ""
    field_of_study: str | None = None


class StudentProfileUpdate(BaseModel):
    nationality: str | None = None
    degree_level: DegreeLevel | None = None
    gpa: float | None = Field(default=None, ge=0.0, le=4.0)
    budget_eur: int | None = Field(default=None, ge=0)
    english_level: EnglishLevel | None = None
    preferred_countries: str | None = None
    field_of_study: str | None = None


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    nationality: str
    degree_level: DegreeLevel
    gpa: float
    budget_eur: int
    english_level: EnglishLevel
    preferred_countries: str
    field_of_study: str | None

    model_config = {"from_attributes": True}
