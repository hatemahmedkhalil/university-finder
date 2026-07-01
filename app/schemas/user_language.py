from datetime import datetime
from pydantic import BaseModel


class UserLanguageCreate(BaseModel):
    language: str
    level: str


class UserLanguageUpdate(BaseModel):
    level: str


class UserLanguageOut(BaseModel):
    id: int
    user_id: int
    language: str
    level: str
    created_at: datetime

    model_config = {"from_attributes": True}
