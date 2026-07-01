from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    title: Mapped[str] = mapped_column(String(50), nullable=True)   # Dr., Prof., Mr., Ms.
    language: Mapped[str] = mapped_column(String(50), nullable=False)  # english / german / polish
    specialty: Mapped[str] = mapped_column(String(150), nullable=True)  # e.g. "Business English, IELTS Prep"
    organization: Mapped[str] = mapped_column(String(150), nullable=True)  # British Council, Goethe Institut…
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    email: Mapped[str] = mapped_column(String(150), nullable=True)
    years_experience: Mapped[int] = mapped_column(nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
