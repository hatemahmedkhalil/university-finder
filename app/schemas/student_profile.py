from pydantic import BaseModel, Field

from app.models.student_profile import DegreeLevel, EnglishLevel


class StudentProfileCreate(BaseModel):
    nationality: str
    degree_level: DegreeLevel
    gpa: float = Field(ge=0.0, le=4.0)
    budget_eur: int = Field(ge=0)
    english_level: EnglishLevel
    language: str = "english"
    preferred_countries: str = ""
    field_of_study: str | None = None
    phone_number: str | None = None
    full_name: str | None = None
    prev_university: str | None = None
    prev_country: str | None = None
    prev_major: str | None = None
    graduation_year: int | None = None
    prev_gpa: float | None = Field(default=None, ge=0.0, le=4.0)


class StudentProfileUpdate(BaseModel):
    nationality: str | None = None
    degree_level: DegreeLevel | None = None
    gpa: float | None = Field(default=None, ge=0.0, le=4.0)
    budget_eur: int | None = Field(default=None, ge=0)
    english_level: EnglishLevel | None = None
    language: str | None = None
    preferred_countries: str | None = None
    field_of_study: str | None = None
    phone_number: str | None = None
    full_name: str | None = None
    prev_university: str | None = None
    prev_country: str | None = None
    prev_major: str | None = None
    graduation_year: int | None = None
    prev_gpa: float | None = Field(default=None, ge=0.0, le=4.0)


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    nationality: str
    degree_level: DegreeLevel
    gpa: float
    budget_eur: int
    english_level: EnglishLevel
    language: str
    preferred_countries: str
    field_of_study: str | None
    phone_number: str | None = None
    full_name: str | None = None
    prev_university: str | None = None
    prev_country: str | None = None
    prev_major: str | None = None
    graduation_year: int | None = None
    prev_gpa: float | None = None

    model_config = {"from_attributes": True}
