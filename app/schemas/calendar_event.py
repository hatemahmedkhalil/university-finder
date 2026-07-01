from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CalendarEventOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    event_date: datetime
    event_type: str
    university_name: Optional[str]
    source: str
    inbound_email_id: Optional[int]
    is_done: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    event_type: str = "info"
    university_name: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    is_done: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
