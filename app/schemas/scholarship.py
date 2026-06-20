from pydantic import BaseModel, field_validator

from app.models.scholarship import ScholarshipType


class ScholarshipCreate(BaseModel):
    university_id: int | None = None
    name: str
    provider: str
    scholarship_type: ScholarshipType
    amount_eur: int | None = None
    description: str | None = None
    eligibility: str | None = None
    deadline: str | None = None
    link: str | None = None

    @field_validator("link")
    @classmethod
    def validate_link(cls, v: str | None) -> str | None:
        if v is not None and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Must be a valid URL starting with http:// or https://")
        return v


class ScholarshipUpdate(BaseModel):
    university_id: int | None = None
    name: str | None = None
    provider: str | None = None
    scholarship_type: ScholarshipType | None = None
    amount_eur: int | None = None
    description: str | None = None
    eligibility: str | None = None
    deadline: str | None = None
    link: str | None = None

    @field_validator("link")
    @classmethod
    def validate_link(cls, v: str | None) -> str | None:
        if v is not None and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Must be a valid URL starting with http:// or https://")
        return v


class ScholarshipOut(BaseModel):
    id: int
    university_id: int | None
    name: str
    provider: str
    scholarship_type: ScholarshipType
    amount_eur: int | None
    description: str | None
    eligibility: str | None
    deadline: str | None
    link: str | None

    model_config = {"from_attributes": True}
