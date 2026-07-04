import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.config import settings

logger = logging.getLogger("university_finder")


def _send(to: str, subject: str, html: str) -> None:
    # Try Resend first (works on Railway — HTTP not SMTP)
    if settings.RESEND_API_KEY:
        _send_via_resend(to, subject, html)
        return

    # Fall back to SMTP (works locally, blocked on Railway)
    if settings.SMTP_HOST and settings.SMTP_USER:
        _send_via_smtp(to, subject, html)
        return

    # No email provider configured — log only (dev/test)
    logger.info(f"[EMAIL MOCK] To: {to} | Subject: {subject}")


def _send_via_resend(to: str, subject: str, html: str) -> None:
    try:
        from_addr = f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>"
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_addr,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        if response.status_code >= 400:
            logger.error(f"[RESEND ERROR] {response.status_code}: {response.text}")
        else:
            logger.info(f"[EMAIL SENT via Resend] To: {to} | Subject: {subject}")
    except Exception as e:
        logger.error(f"[RESEND ERROR] {e}")


def _send_via_smtp(to: str, subject: str, html: str) -> None:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.sendmail(settings.SMTP_USER, to, msg.as_string())
        logger.info(f"[EMAIL SENT via SMTP] To: {to} | Subject: {subject}")
    except Exception as e:
        logger.error(f"[SMTP ERROR] Failed to send to {to}: {e}")


def send_verification_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    _send(
        to=to,
        subject="Verify your UniPath account",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1e1b4b;margin-bottom:8px">Welcome to UniPath! 🎓</h2>
          <p style="color:#4b5563;margin-bottom:24px">Click the button below to verify your email address and activate your account.</p>
          <a href="{link}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
            Verify Email
          </a>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px">Or copy this link:<br><a href="{link}" style="color:#4f46e5">{link}</a></p>
          <p style="color:#d1d5db;font-size:12px;margin-top:32px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
        </div>
        """,
    )


def send_password_reset_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    _send(
        to=to,
        subject="Reset your UniPath password",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1e1b4b;margin-bottom:8px">Password Reset</h2>
          <p style="color:#4b5563;margin-bottom:24px">Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="{link}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:13px;margin-top:24px">Or copy this link:<br><a href="{link}" style="color:#4f46e5">{link}</a></p>
          <p style="color:#d1d5db;font-size:12px;margin-top:32px">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        """,
    )
