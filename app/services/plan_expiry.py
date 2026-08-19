"""Downgrades users whose paid plan period has ended back to "free".

Paymob has no native recurring billing — a payment buys a fixed period
(plan.duration_days), and this daily job is what actually enforces the end
of that period. Runs once a day via APScheduler (see app/main.py).
"""
import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger("university_finder")


def run_plan_expiry() -> dict:
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired = (
            db.query(User)
            .filter(User.plan != "free", User.plan_expires_at.isnot(None), User.plan_expires_at <= now)
            .all()
        )
        for user in expired:
            user.plan = "free"
            user.plan_expires_at = None
        db.commit()
        if expired:
            logger.info("Plan expiry: downgraded %d user(s) to free", len(expired))
        return {"ok": True, "downgraded": len(expired)}
    finally:
        db.close()
