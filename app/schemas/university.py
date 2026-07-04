from pydantic import BaseModel, field_validator

from app.schemas.scholarship import ScholarshipOut


class ProgramFeeOut(BaseModel):
    id: int
    field_of_study: str
    degree_level: str
    tuition_fee_eur: int
    notes: str | None

    model_config = {"from_attributes": True}


def _validate_url(v: str | None) -> str | None:
    if v is not None and not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("Must be a valid URL starting with http:// or https://")
    return v


_DETAIL_FIELDS = [
    ("programs", str), ("admission_requirements", str), ("required_documents", str),
    ("application_deadline", str), ("language_requirements", str), ("study_duration", str),
    ("accommodation_info", str), ("application_fee_eur", int), ("living_cost_eur", int),
    ("min_gpa", float), ("logo_url", str), ("contact_email", str), ("contact_phone", str),
]


class UniversityCreate(BaseModel):
    name: str
    country: str
    city: str
    website: str | None = None
    description: str | None = None
    ranking: int | None = None
    tuition_fee_eur: int | None = None
    acceptance_rate: float | None = None
    is_public: bool = True
    english_programs_available: bool = False
    programs: str | None = None
    admission_requirements: str | None = None
    required_documents: str | None = None
    application_deadline: str | None = None
    language_requirements: str | None = None
    study_duration: str | None = None
    accommodation_info: str | None = None
    application_fee_eur: int | None = None
    living_cost_eur: int | None = None
    min_gpa: float | None = None
    logo_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    study_language: str | None = None
    dormitory_cost_eur: int | None = None
    semester_fee_eur: int | None = None
    notes: str | None = None

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str | None) -> str | None:
        return _validate_url(v)


class UniversityUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    city: str | None = None
    website: str | None = None
    description: str | None = None
    ranking: int | None = None
    tuition_fee_eur: int | None = None
    acceptance_rate: float | None = None
    is_public: bool | None = None
    english_programs_available: bool | None = None
    programs: str | None = None
    admission_requirements: str | None = None
    required_documents: str | None = None
    application_deadline: str | None = None
    language_requirements: str | None = None
    study_duration: str | None = None
    accommodation_info: str | None = None
    application_fee_eur: int | None = None
    living_cost_eur: int | None = None
    min_gpa: float | None = None
    logo_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    study_language: str | None = None
    dormitory_cost_eur: int | None = None
    semester_fee_eur: int | None = None
    notes: str | None = None

    @field_validator("website")
    @classmethod
    def validate_website(cls, v: str | None) -> str | None:
        return _validate_url(v)


class UniversityOut(BaseModel):
    id: int
    name: str
    country: str
    city: str
    website: str | None
    description: str | None
    ranking: int | None
    tuition_fee_eur: int | None
    acceptance_rate: float | None
    is_public: bool
    english_programs_available: bool
    programs: str | None
    admission_requirements: str | None
    required_documents: str | None
    application_deadline: str | None
    language_requirements: str | None
    study_duration: str | None
    accommodation_info: str | None
    application_fee_eur: int | None
    living_cost_eur: int | None
    min_gpa: float | None
    logo_url: str | None
    contact_email: str | None
    contact_phone: str | None
    study_language: str | None
    dormitory_cost_eur: int | None
    semester_fee_eur: int | None
    notes: str | None

    model_config = {"from_attributes": True}


class UniversityDetail(UniversityOut):
    scholarships: list[ScholarshipOut] = []
    program_fees: list[ProgramFeeOut] = []
