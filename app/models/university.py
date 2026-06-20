from sqlalchemy import Boolean, Float, Integer, String, Text
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

    scholarships: Mapped[list["Scholarship"]] = relationship(back_populates="university", cascade="all, delete-orphan")  # noqa: F821
