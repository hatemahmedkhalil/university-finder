from datetime import datetime
from sqlalchemy import Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class InstructorPost(Base):
    __tablename__ = "instructor_posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("instructors.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    instructor: Mapped["Instructor"] = relationship("Instructor", lazy="joined")
