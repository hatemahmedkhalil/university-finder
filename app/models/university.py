from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
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
    program_fees: Mapped[list["UniversityProgram"]] = relationship(back_populates="university", cascade="all, delete-orphan", order_by="UniversityProgram.degree_level, UniversityProgram.field_of_study")  # noqa: F821
    document_items: Mapped[list["UniversityDocumentItem"]] = relationship(back_populates="university", cascade="all, delete-orphan", order_by="UniversityDocumentItem.order_index")


class UniversityDocumentItem(Base):
    __tablename__ = "university_document_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    university: Mapped["University"] = relationship(back_populates="document_items")


class UniversityProgram(Base):
    __tablename__ = "university_programs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    field_of_study: Mapped[str] = mapped_column(String(150), nullable=False)
    degree_level: Mapped[str] = mapped_column(String(20), nullable=False)   # bachelor | master | phd | all
    tuition_fee_eur: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))

    university: Mapped["University"] = relationship(back_populates="program_fees")
