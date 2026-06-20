import enum

from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    preferred_countries: Mapped[str] = mapped_column(Text, nullable=False, default="")
    field_of_study: Mapped[str | None] = mapped_column(String(200))

    user: Mapped["User"] = relationship(back_populates="profile")  # noqa: F821
