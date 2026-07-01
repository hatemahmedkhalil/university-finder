import enum

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional

from app.database import Base


class DegreeLevel(str, enum.Enum):
    bachelor = "bachelor"
    master = "master"
    phd = "phd"


class EnglishLevel(str, enum.Enum):
    a1 = "a1"
    a2 = "a2"
    b1 = "b1"
    b2 = "b2"
    c1 = "c1"
    c2 = "c2"
    native = "native"


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    nationality: Mapped[str] = mapped_column(String(100), nullable=False)
    degree_level: Mapped[DegreeLevel] = mapped_column(Enum(DegreeLevel), nullable=False)
    gpa: Mapped[float] = mapped_column(Float, nullable=False)
    budget_eur: Mapped[int] = mapped_column(Integer, nullable=False)
    english_level: Mapped[EnglishLevel] = mapped_column(Enum(EnglishLevel), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False, default="english")
    preferred_countries: Mapped[str] = mapped_column(Text, nullable=False, default="")
    field_of_study: Mapped[str | None] = mapped_column(String(200))
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True, default=None)
    # JSON: {"english": {"level": "B2", "score": 14, "total": 20}, "german": {...}}
    placement_results: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True, default=None)

    user: Mapped["User"] = relationship(back_populates="profile")  # noqa: F821
