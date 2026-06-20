from pydantic import BaseModel, field_validator


def _validate_url(v: str | None) -> str | None:
    if v is not None and not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("Must be a valid URL starting with http:// or https://")
    return v


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

    model_config = {"from_attributes": True}
