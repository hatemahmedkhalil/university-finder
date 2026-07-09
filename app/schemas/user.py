from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _strong_password(v: str) -> str:
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one number")
    return v


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(default="", max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _strong_password(v)


class EmailUpdateRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    has_completed_onboarding: bool = False
    role: str
    plan: str = "free"
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
