"""Test Simulator models — TOEFL, Cambridge B2 First, extensible to other exams."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExamPassage(Base):
    """A reading or listening passage used in an exam section."""
    __tablename__ = "exam_passages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_type: Mapped[str] = mapped_column(String(20), nullable=False)   # toefl | cambridge
    section: Mapped[str] = mapped_column(String(30), nullable=False)     # reading | listening
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(10), default="B2")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    questions: Mapped[list["ExamQuestion"]] = relationship(
        back_populates="passage", cascade="all, delete-orphan",
        order_by="ExamQuestion.order_index",
    )


class ExamQuestion(Base):
    """A single question belonging to a section (and optionally a passage)."""
    __tablename__ = "exam_questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    exam_type: Mapped[str] = mapped_column(String(20), nullable=False)
    section: Mapped[str] = mapped_column(String(30), nullable=False)
    subsection: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # question_type: mcq | essay | short_answer
    question_type: Mapped[str] = mapped_column(String(30), nullable=False, default="mcq")
    passage_id: Mapped[int | None] = mapped_column(
        ForeignKey("exam_passages.id", ondelete="CASCADE"), nullable=True, index=True
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON ["A) ...", ...]
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[float] = mapped_column(Float, default=1.0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    passage: Mapped["ExamPassage | None"] = relationship(back_populates="questions")


class SimulatorAttempt(Base):
    """Tracks one student's full attempt at an exam."""
    __tablename__ = "simulator_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exam_type: Mapped[str] = mapped_column(String(20), nullable=False)  # ielts | toefl | cambridge
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    # in_progress | completed | abandoned
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_band: Mapped[str | None] = mapped_column(String(20), nullable=True)
    score_breakdown: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON per section
    score_report: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON AI report

    section_results: Mapped[list["SimulatorSectionResult"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan",
    )


class SimulatorSectionResult(Base):
    """Per-section result within one attempt."""
    __tablename__ = "simulator_section_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("simulator_attempts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    section_name: Mapped[str] = mapped_column(String(50), nullable=False)
    answers: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON {question_id: answer}
    raw_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    scaled_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    band: Mapped[str | None] = mapped_column(String(10), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON from AI
    time_spent: Mapped[int | None] = mapped_column(Integer, nullable=True)  # seconds
    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    attempt: Mapped["SimulatorAttempt"] = relationship(back_populates="section_results")
