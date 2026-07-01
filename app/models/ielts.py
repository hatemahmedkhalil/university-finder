"""IELTS Simulator models."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IeltsTest(Base):
    __tablename__ = "ielts_tests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=170)  # real IELTS = 2h 50min
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    sections: Mapped[list["IeltsSection"]] = relationship(
        back_populates="test", cascade="all, delete-orphan",
        order_by="IeltsSection.order_index",
    )


class IeltsSection(Base):
    __tablename__ = "ielts_sections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("ielts_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)   # Listening | Reading | Writing | Speaking
    instructions: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    test: Mapped["IeltsTest"] = relationship(back_populates="sections")
    questions: Mapped[list["IeltsQuestion"]] = relationship(
        back_populates="section", cascade="all, delete-orphan",
        order_by="IeltsQuestion.order_index",
    )


class IeltsQuestion(Base):
    __tablename__ = "ielts_questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("ielts_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(30), default="multiple_choice")
    # multiple_choice | true_false | short_answer | essay | matching
    options_json: Mapped[str | None] = mapped_column(Text)   # JSON array for MC options
    correct_answer: Mapped[str | None] = mapped_column(Text)
    marks: Mapped[int] = mapped_column(Integer, default=1)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    section: Mapped["IeltsSection"] = relationship(back_populates="questions")
