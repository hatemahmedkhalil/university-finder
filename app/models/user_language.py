from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserLanguage(Base):
    __tablename__ = "user_languages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(50), nullable=False)   # english | german | polish | ...
    level: Mapped[str] = mapped_column(String(10), nullable=False)      # A1 A2 B1 B2 C1 C2 native
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
