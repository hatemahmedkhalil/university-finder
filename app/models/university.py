from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class University(Base):
    __tablename__ = "universities"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    ranking: Mapped[int | None] = mapped_column(Integer)
    tuition_fee_eur: Mapped[int | None] = mapped_column(Integer)
    acceptance_rate: Mapped[float | None] = mapped_column(Float)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    english_programs_available: Mapped[bool] = mapped_column(Boolean, default=False)

    # Detail fields
    programs: Mapped[str | None] = mapped_column(Text)
    admission_requirements: Mapped[str | None] = mapped_column(Text)
    required_documents: Mapped[str | None] = mapped_column(Text)
    application_deadline: Mapped[str | None] = mapped_column(String(200))
    language_requirements: Mapped[str | None] = mapped_column(Text)
    study_duration: Mapped[str | None] = mapped_column(String(200))
    accommodation_info: Mapped[str | None] = mapped_column(Text)
    application_fee_eur: Mapped[int | None] = mapped_column(Integer)
    living_cost_eur: Mapped[int | None] = mapped_column(Integer)
    min_gpa: Mapped[float | None] = mapped_column(Float)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    contact_email: Mapped[str | None] = mapped_column(String(200))
    contact_phone: Mapped[str | None] = mapped_column(String(100))

    # New enriched fields
    study_language: Mapped[str | None] = mapped_column(String(100))
    dormitory_cost_eur: Mapped[int | None] = mapped_column(Integer)
    semester_fee_eur: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    # Application hub
    application_method: Mapped[str | None] = mapped_column(String(30))   # uni_assist | own_portal | irk | email
    application_portal_url: Mapped[str | None] = mapped_column(String(500))

    # Application guide (generated once, editable by admin)
    application_guide: Mapped[str | None] = mapped_column(Text)           # JSON array of steps
    guide_generated_at: Mapped[datetime | None] = mapped_column(DateTime)

    scholarships: Mapped[list["Scholarship"]] = relationship(back_populates="university", cascade="all, delete-orphan")  # noqa: F821
