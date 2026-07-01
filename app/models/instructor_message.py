from datetime import datetime
from sqlalchemy import Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class InstructorMessage(Base):
    __tablename__ = "instructor_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    reply: Mapped[str] = mapped_column(Text, nullable=True)
    replied_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    instructor: Mapped["Instructor"] = relationship("Instructor", lazy="joined")
    user: Mapped["User"] = relationship("User", lazy="joined")
