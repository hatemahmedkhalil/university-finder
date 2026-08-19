"""Generates a short AI comment on each student's last-24h activity
(pipeline additions, favourites, calendar events) and saves it as a
Notification. Runs once daily via APScheduler (see app/main.py).
"""
import logging

import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.ai_client import ai_configured, chat_completion
from app.services.notify import create_notification

logger = logging.getLogger("university_finder")


def _comment_on_activity(student_name: str, field_of_study: str | None, activity: str) -> str:
    """Ask the AI for one short, warm, specific sentence about this activity."""
    prompt = f"""You are UniAdvisor, a personal study-abroad advisor. Write ONE short, warm, specific sentence (max 30 words) reacting to this student's recent activity on the platform.

Student: {student_name or "the student"}
Field of study: {field_of_study or "unknown"}
Activity: {activity}

Rules:
- Be specific and encouraging, like "I see you added X to your pipeline, great choice for Y major!"
- Do NOT say "based on the data" or similar robotic phrases
- Plain text only, no markdown, no quotes around the sentence
- Return ONLY the sentence, nothing else"""

    content = chat_completion(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=80,
        temperature=0.6,
    )
    return content.strip('"')


def _process_user(db: Session, user_id: int) -> int:
    """Generate notifications for one user's last-24h activity. Returns count created."""
    profile = db.execute(sa.text(
        "SELECT full_name, field_of_study FROM student_profiles WHERE user_id = :uid"
    ), {"uid": user_id}).fetchone()
    student_name = profile.full_name if profile else None
    field_of_study = profile.field_of_study if profile else None

    created = 0

    # ── New pipeline entries in the last 24h, not yet notified ──────────────
    pipeline_rows = db.execute(sa.text("""
        SELECT ap.id, u.name AS uni_name
        FROM application_pipeline ap
        JOIN universities u ON u.id = ap.university_id
        WHERE ap.user_id = :uid
          AND ap.created_at >= NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = :uid AND n.reference_type = 'pipeline_ai' AND n.reference_id = ap.id
          )
    """), {"uid": user_id}).fetchall()

    for row in pipeline_rows:
        try:
            msg = _comment_on_activity(
                student_name, field_of_study,
                f"Added {row.uni_name} to their application pipeline",
            )
        except Exception as e:
            logger.error("Daily insight (pipeline) failed for user %s: %s", user_id, e)
            continue
        create_notification(
            db, user_id, title="UniAdvisor noticed",
            message=msg, type="ai_insight",
            reference_id=row.id, reference_type="pipeline_ai",
        )
        created += 1

    # ── New favourites in the last 24h, not yet notified ────────────────────
    fav_rows = db.execute(sa.text("""
        SELECT f.id, u.name AS uni_name
        FROM favourites f
        JOIN universities u ON u.id = f.university_id
        WHERE f.user_id = :uid
          AND f.created_at >= NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = :uid AND n.reference_type = 'favourite_ai' AND n.reference_id = f.id
          )
    """), {"uid": user_id}).fetchall()

    for row in fav_rows:
        try:
            msg = _comment_on_activity(
                student_name, field_of_study,
                f"Saved {row.uni_name} to their favourites",
            )
        except Exception as e:
            logger.error("Daily insight (favourite) failed for user %s: %s", user_id, e)
            continue
        create_notification(
            db, user_id, title="UniAdvisor noticed",
            message=msg, type="ai_insight",
            reference_id=row.id, reference_type="favourite_ai",
        )
        created += 1

    # ── New calendar events in the last 24h, not yet notified ───────────────
    cal_rows = db.execute(sa.text("""
        SELECT id, title, event_date, event_type
        FROM calendar_events
        WHERE user_id = :uid
          AND created_at >= NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.user_id = :uid AND n.reference_type = 'calendar_ai' AND n.reference_id = calendar_events.id
          )
    """), {"uid": user_id}).fetchall()

    for row in cal_rows:
        try:
            msg = _comment_on_activity(
                student_name, field_of_study,
                f"Added '{row.title}' ({row.event_type}) to their calendar for {row.event_date}",
            )
        except Exception as e:
            logger.error("Daily insight (calendar) failed for user %s: %s", user_id, e)
            continue
        create_notification(
            db, user_id, title="UniAdvisor noticed",
            message=msg, type="ai_insight",
            reference_id=row.id, reference_type="calendar_ai",
        )
        created += 1

    return created


def run_daily_insights() -> dict:
    """Entry point for the scheduler / manual trigger. Processes all users with recent activity."""
    if not ai_configured():
        logger.warning("Daily insights skipped: no AI provider configured (GROQ_API_KEY / GEMINI_API_KEY)")
        return {"ok": False, "reason": "no_ai_key"}

    db = SessionLocal()
    total_created = 0
    users_processed = 0
    try:
        user_ids = db.execute(sa.text("""
            SELECT DISTINCT user_id FROM (
                SELECT user_id FROM application_pipeline WHERE created_at >= NOW() - INTERVAL '24 hours'
                UNION
                SELECT user_id FROM favourites WHERE created_at >= NOW() - INTERVAL '24 hours'
                UNION
                SELECT user_id FROM calendar_events WHERE created_at >= NOW() - INTERVAL '24 hours'
            ) t
        """)).fetchall()

        for row in user_ids:
            try:
                created = _process_user(db, row.user_id)
                total_created += created
                users_processed += 1
                db.commit()
            except Exception as e:
                logger.error("Daily insights failed for user %s: %s", row.user_id, e)
                db.rollback()
    finally:
        db.close()

    logger.info("Daily insights run complete: %d users, %d notifications", users_processed, total_created)
    return {"ok": True, "users_processed": users_processed, "notifications_created": total_created}
