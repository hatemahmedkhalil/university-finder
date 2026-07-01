from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

VALID_STATUSES = ("shortlisted", "preparing", "ready", "submitted", "decision")
VALID_DECISIONS = ("accepted", "rejected", "waitlisted")


class PipelineEntry(Base):
    __tablename__ = "application_pipeline"
    __table_args__ = (UniqueConstraint("user_id", "university_id", name="uq_pipeline_user_uni"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="shortlisted")
    fit_score: Mapped[int | None] = mapped_column(Integer)
    fit_analysis: Mapped[str | None] = mapped_column(Text)
    fit_gaps: Mapped[str | None] = mapped_column(Text)        # JSON string
    motivation_letter: Mapped[str | None] = mapped_column(Text)
    checklist: Mapped[str | None] = mapped_column(Text)       # JSON string
    deadline_note: Mapped[str | None] = mapped_column(String(200))
    decision: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    university: Mapped["University"] = relationship("University")  # noqa: F821
