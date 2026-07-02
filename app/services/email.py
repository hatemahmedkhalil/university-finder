import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("university_finder")


def _send(to: str, subject: str, html: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(f"[EMAIL MOCK] To: {to} | Subject: {subject} | Body: {html}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.sendmail(settings.SMTP_USER, to, msg.as_string())
        logger.info(f"[EMAIL SENT] To: {to} | Subject: {subject}")
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send to {to}: {e}")


def send_verification_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    _send(
        to=to,
        subject="Verify your University Finder account",
        html=f"""
        <h2>Welcome to University Finder!</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="{link}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Verify Email
        </a>
        <p>Or copy this link: {link}</p>
        <p>This link does not expire.</p>
        """,
    )


def send_password_reset_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    _send(
        to=to,
        subject="Reset your University Finder password",
        html=f"""
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="{link}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Reset Password
        </a>
        <p>Or copy this link: {link}</p>
        <p>If you didn't request this, you can ignore this email.</p>
        """,
    )
