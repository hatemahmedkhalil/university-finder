from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from app.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title            = Column(String(300), nullable=False)
    description      = Column(String(1000), nullable=True)
    event_date       = Column(DateTime(timezone=True), nullable=False)
    event_type       = Column(String(50), nullable=False, default="info")
    university_name  = Column(String(200), nullable=True)
    source           = Column(String(50), nullable=False, default="manual")  # "email" | "manual"
    inbound_email_id = Column(Integer, ForeignKey("inbound_emails.id"), nullable=True)
    is_done          = Column(Boolean, nullable=False, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
