from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str = ""


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
