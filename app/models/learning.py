"""Learning Center models — placement tests and language courses."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlacementTest(Base):
    __tablename__ = "placement_tests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)   # english | german | polish
    description: Mapped[str | None] = mapped_column(Text)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    questions: Mapped[list["PlacementTestQuestion"]] = relationship(
        back_populates="test", cascade="all, delete-orphan", order_by="PlacementTestQuestion.order_index"
    )


class PlacementTestQuestion(Base):
    """Individual question inside a placement test — empty until admin populates it."""
    __tablename__ = "placement_test_questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    test_id: Mapped[int] = mapped_column(ForeignKey("placement_tests.id"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[str | None] = mapped_column(Text)   # JSON array of choice strings
    correct_answer: Mapped[str | None] = mapped_column(String(500))
    level: Mapped[str | None] = mapped_column(String(10))    # A1 | A2 | B1 | B2 | C1 | C2
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    test: Mapped["PlacementTest"] = relationship(back_populates="questions")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)   # english | german | polish
    level: Mapped[str | None] = mapped_column(String(10))               # A1 | A2 | B1 | B2 | C1 | C2
    description: Mapped[str | None] = mapped_column(Text)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index"
    )


class Lesson(Base):
    """A single lesson inside a course — supports video, PDF, text or quiz."""
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    content_type: Mapped[str | None] = mapped_column(String(20))   # video | pdf | text | quiz
    content_url: Mapped[str | None] = mapped_column(String(500))
    content_text: Mapped[str | None] = mapped_column(Text)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    course: Mapped["Course"] = relationship(back_populates="lessons")
