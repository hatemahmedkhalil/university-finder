import enum

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ScholarshipType(str, enum.Enum):
    full = "full"
    partial = "partial"
    merit = "merit"
    need_based = "need_based"
    government = "government"


class Scholarship(Base):
    __tablename__ = "scholarships"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int | None] = mapped_column(ForeignKey("universities.id"), nullable=True)

    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(200), nullable=False)
    scholarship_type: Mapped[ScholarshipType] = mapped_column(Enum(ScholarshipType), nullable=False)
    amount_eur: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    eligibility: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[str | None] = mapped_column(String(50))
    link: Mapped[str | None] = mapped_column(String(500))

    university: Mapped["University"] = relationship(back_populates="scholarships")  # noqa: F821
