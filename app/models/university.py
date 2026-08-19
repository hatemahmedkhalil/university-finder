from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Valid values for UniversityDocumentItem.verification_status. Existing rows
# are backfilled to "unverified" — nothing is auto-promoted to "verified"
# just because it already exists in the database.
# conflicting: two authoritative sources disagree — both preserved via
#              separate rows, never silently resolved to one.
# needs_manual_verification: source could not be reliably inspected live
#              (bot protection, JS-rendered content, unreadable PDF) —
#              distinct from 'unverified' (never checked) and from
#              'verified'/'partially_verified' (checked and held up).
VERIFICATION_STATUSES = ("verified", "partially_verified", "unverified", "unknown", "conflicting", "needs_manual_verification")


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
    deadlines: Mapped[list["UniversityDeadline"]] = relationship(back_populates="university", cascade="all, delete-orphan", order_by="UniversityDeadline.order_index")


class UniversityDocumentItem(Base):
    __tablename__ = "university_document_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    degree_level: Mapped[str] = mapped_column(String(20), nullable=False, default="all")  # all | bachelor | master | phd

    # ── Verification / traceability (Phase 2 — university data audit) ──
    # condition: {"type": "nationality" | "education_country" | "other",
    #             "values": [...], "note": "..."} or null for unconditional.
    condition: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    evidence_text: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    # verified | partially_verified | unverified | unknown — see VERIFICATION_STATUSES.
    # Never auto-promoted; a requirement is only "verified" once independently
    # confirmed against an authoritative source_url + evidence_text.
    verification_status: Mapped[str] = mapped_column(String(30), nullable=False, default="unverified")
    verified_at: Mapped[date | None] = mapped_column(Date, nullable=True, default=None)

    university: Mapped["University"] = relationship(back_populates="document_items")


class UniversityDeadline(Base):
    """
    Auditable deadline entries (Phase 3.5 — audit hardening). Replaces the
    practice of squeezing deadline evidence into University.application_deadline
    (a bare String(200) with no source/evidence/condition fields at all).

    A university can have MULTIPLE rows here — e.g. Heidelberg's real
    situation is "no single university-wide deadline"; each verifiable
    programme-level deadline gets its own row instead of forcing a false
    universal date into one field. application_deadline on University is
    left untouched as the legacy freetext fallback the readiness engine
    already reads; this table is the auditable source of truth going forward.
    """
    __tablename__ = "university_deadlines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # What this row describes, e.g. "Winter semester (general)",
    # "M.Sc. Scientific Computing — non-EU intake".
    label: Mapped[str] = mapped_column(String(300), nullable=False)
    # The actual deadline text, preserved as the source states it —
    # never collapsed into a fabricated single date. e.g. "15 July" or
    # "1 April – 31 May 2026".
    deadline_text: Mapped[str] = mapped_column(String(300), nullable=False)
    # Application cycle this deadline is for, e.g. "2026/27" — lets us tell
    # current-cycle information apart from information found for an older
    # cycle that hasn't been re-checked. Null = cycle not stated by source.
    cycle: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)
    # Same condition shape as UniversityDocumentItem.condition — narrows
    # which students/programmes this specific deadline row applies to.
    condition: Mapped[dict | None] = mapped_column(JSON, nullable=True, default=None)

    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)
    evidence_text: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    verification_status: Mapped[str] = mapped_column(String(30), nullable=False, default="unverified")
    verified_at: Mapped[date | None] = mapped_column(Date, nullable=True, default=None)

    university: Mapped["University"] = relationship(back_populates="deadlines")


class UniversityProgram(Base):
    __tablename__ = "university_programs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)
    field_of_study: Mapped[str] = mapped_column(String(150), nullable=False)
    degree_level: Mapped[str] = mapped_column(String(20), nullable=False)   # bachelor | master | phd | all
    tuition_fee_eur: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500))

    university: Mapped["University"] = relationship(back_populates="program_fees")
