from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "system",
    reference_id: int | None = None,
    reference_type: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        reference_id=reference_id,
        reference_type=reference_type,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    return notif
