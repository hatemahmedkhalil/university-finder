from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class LinkEmailRequest(BaseModel):
    linked_email: EmailStr
    consent_given: bool = Field(..., description="Must be True — user explicitly agreed")


class LinkedEmailOut(BaseModel):
    id: int
    linked_email: str
    consent_given_at: datetime
    consent_version: str
    is_active: bool
    forwarding_confirmed: bool

    model_config = {"from_attributes": True}


class InboundEmailOut(BaseModel):
    id: int
    from_address: str
    subject: str
    body_preview: str | None
    received_at: datetime
    detected_university: str | None
    detected_status: str | None
    is_read: bool

    model_config = {"from_attributes": True}
