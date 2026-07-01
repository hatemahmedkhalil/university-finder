import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db, require_admin
from app.models.calendar_event import CalendarEvent
from app.models.email_integration import InboundEmail, LinkedEmail
from app.models.notification import Notification
from app.models.user import User
from app.schemas.email_integration import InboundEmailOut, LinkEmailRequest, LinkedEmailOut

router = APIRouter(prefix="/email-integration", tags=["Email Integration"])

CONSENT_VERSION = "1.0"
FORWARDING_ADDRESS = "notify@unifind.com"

# Keywords to detect university email status
_STATUS_KEYWORDS = {
    "accepted": ["congratulations", "accepted", "admission offered", "offer of admission", "pleased to inform", "been admitted"],
    "rejected": ["unfortunately", "regret to inform", "not been accepted", "unsuccessful", "unable to offer"],
    "interview": ["interview", "online assessment", "entrance exam", "test invitation"],
    "missing_docs": ["missing", "incomplete", "additional documents", "please submit", "required documents"],
    "info": [],  # fallback
}


def _detect_status(subject: str, body: str) -> str:
    text = (subject + " " + body).lower()
    for status, keywords in _STATUS_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return status
    return "info"


def _detect_university(from_address: str, subject: str) -> str | None:
    # Try to extract university name from domain
    domain_match = re.search(r"@([\w\-]+)\.", from_address)
    if domain_match:
        domain = domain_match.group(1)
        # Known domains
        known = {
            "uni-assist": "uni-assist",
            "tum": "TU Munich",
            "kit": "Karlsruhe Institute of Technology",
            "fu-berlin": "Freie Universität Berlin",
            "lmu": "LMU Munich",
            "rwth-aachen": "RWTH Aachen",
            "tu-dortmund": "TU Dortmund",
            "hochschulstart": "Hochschulstart",
        }
        for key, name in known.items():
            if key in domain:
                return name
        # Generic: capitalize domain as best guess
        if len(domain) > 2:
            return domain.upper()
    return None


# ── Student endpoints ──────────────────────────────────────────────────────────

@router.get("/status", response_model=LinkedEmailOut | None)
def get_link_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(LinkedEmail).filter(
        LinkedEmail.user_id == current_user.id,
        LinkedEmail.is_active == True,
    ).first()
    return record


@router.post("/link", response_model=LinkedEmailOut)
def link_email(
    body: LinkEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.consent_given:
        raise HTTPException(status_code=400, detail="Consent is required to link your email.")

    # Remove any existing record
    db.query(LinkedEmail).filter(LinkedEmail.user_id == current_user.id).delete()

    client_ip = request.client.host if request.client else None
    record = LinkedEmail(
        user_id=current_user.id,
        linked_email=str(body.linked_email),
        consent_given_at=datetime.now(timezone.utc),
        consent_ip=client_ip,
        consent_version=CONSENT_VERSION,
        is_active=True,
        forwarding_confirmed=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/confirm-forwarding", response_model=LinkedEmailOut)
def confirm_forwarding(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(LinkedEmail).filter(
        LinkedEmail.user_id == current_user.id,
        LinkedEmail.is_active == True,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No linked email found.")
    record.forwarding_confirmed = True
    db.commit()
    db.refresh(record)
    return record


@router.delete("/unlink", status_code=204)
def unlink_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(LinkedEmail).filter(LinkedEmail.user_id == current_user.id).delete()
    db.query(InboundEmail).filter(InboundEmail.user_id == current_user.id).delete()
    db.commit()


@router.get("/emails", response_model=list[InboundEmailOut])
def list_emails(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(InboundEmail)
        .filter(InboundEmail.user_id == current_user.id)
        .order_by(InboundEmail.received_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/emails/{email_id}/read", status_code=204)
def mark_read(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    email = db.query(InboundEmail).filter(
        InboundEmail.id == email_id,
        InboundEmail.user_id == current_user.id,
    ).first()
    if email:
        email.is_read = True
        db.commit()


# ── Inbound webhook (called by Mailgun / email forwarding service) ─────────────

@router.post("/inbound", status_code=200)
async def receive_inbound_email(
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_secret: str | None = Header(default=None),
):
    # Validate webhook secret to prevent abuse
    expected = getattr(settings, "EMAIL_WEBHOOK_SECRET", None)
    if expected and x_webhook_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid webhook secret.")

    form = await request.form()
    recipient = str(form.get("recipient", ""))       # should be notify@unifind.com
    sender = str(form.get("sender", ""))
    subject = str(form.get("subject", ""))
    body_plain = str(form.get("body-plain", ""))[:1000]

    # Find which student this email belongs to
    # Mailgun puts original To/Delivered-To in headers
    # We match by the student's linked email that forwarded it
    # Simplest: match by "X-Forwarded-To" or "X-Original-To" header
    message_headers = str(form.get("message-headers", ""))
    original_to = ""
    # Try to find original recipient from headers JSON
    import json as _json
    try:
        headers_list = _json.loads(message_headers)
        for hdr in headers_list:
            if hdr[0].lower() in ("x-original-to", "x-forwarded-to", "delivered-to"):
                original_to = hdr[1]
                break
    except Exception:
        pass

    # Find the linked email record
    linked = None
    if original_to:
        linked = db.query(LinkedEmail).filter(
            LinkedEmail.linked_email == original_to,
            LinkedEmail.is_active == True,
        ).first()

    if not linked:
        # Can't match to a student — ignore
        return {"status": "unmatched"}

    detected_uni = _detect_university(sender, subject)
    detected_status = _detect_status(subject, body_plain)

    email_record = InboundEmail(
        user_id=linked.user_id,
        from_address=sender,
        subject=subject[:500],
        body_preview=body_plain[:500] if body_plain else None,
        received_at=datetime.now(timezone.utc),
        detected_university=detected_uni,
        detected_status=detected_status,
    )
    db.add(email_record)

    # Create a notification for the student
    status_labels = {
        "accepted": "🎉 Acceptance update",
        "rejected": "📋 Application update",
        "interview": "📅 Interview invitation",
        "missing_docs": "📎 Documents requested",
        "info": "✉️ University email",
    }
    label = status_labels.get(detected_status, "✉️ University email")
    uni_name = detected_uni or sender
    notif = Notification(
        user_id=linked.user_id,
        title=f"{label} from {uni_name}",
        body=subject[:200],
        type="email",
    )
    db.add(notif)

    # Auto-create a calendar event based on detected status
    _create_calendar_event(db, linked.user_id, detected_status, detected_uni, subject, email_record)

    db.commit()

    return {"status": "ok"}


def _create_calendar_event(db: Session, user_id: int, status: str, uni_name: str | None, subject: str, email_record: InboundEmail):
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    uni = uni_name or "University"

    # Map status → event title, type, and a sensible default date offset
    configs = {
        "accepted": {
            "title": f"🎉 Accepted by {uni}",
            "description": f"Acceptance email received: {subject[:200]}",
            "event_type": "accepted",
            "offset_days": 0,
        },
        "rejected": {
            "title": f"📋 Application result — {uni}",
            "description": f"Decision email received: {subject[:200]}",
            "event_type": "rejected",
            "offset_days": 0,
        },
        "interview": {
            "title": f"📅 Interview — {uni}",
            "description": f"Interview invitation received. Check email for exact date and time.\n\nEmail: {subject[:200]}",
            "event_type": "interview",
            "offset_days": 7,   # placeholder — student can edit the real date
        },
        "missing_docs": {
            "title": f"📎 Submit documents — {uni}",
            "description": f"Documents requested by {uni}. Check email for deadline.\n\nEmail: {subject[:200]}",
            "event_type": "deadline",
            "offset_days": 14,  # placeholder deadline
        },
        "info": {
            "title": f"✉️ Email from {uni}",
            "description": subject[:200],
            "event_type": "info",
            "offset_days": 0,
        },
    }

    cfg = configs.get(status, configs["info"])
    event_date = now + timedelta(days=cfg["offset_days"])

    cal_event = CalendarEvent(
        user_id=user_id,
        title=cfg["title"],
        description=cfg["description"],
        event_date=event_date,
        event_type=cfg["event_type"],
        university_name=uni_name,
        source="email",
        inbound_email_id=email_record.id,
    )
    db.add(cal_event)


# ── Admin endpoint — manually log an email update ──────────────────────────────

@router.post("/admin/log", dependencies=[Depends(require_admin)], response_model=InboundEmailOut)
def admin_log_email(
    user_id: int,
    from_address: str,
    subject: str,
    body_preview: str | None = None,
    db: Session = Depends(get_db),
):
    detected_uni = _detect_university(from_address, subject)
    detected_status = _detect_status(subject, body_preview or "")

    record = InboundEmail(
        user_id=user_id,
        from_address=from_address,
        subject=subject,
        body_preview=body_preview,
        detected_university=detected_uni,
        detected_status=detected_status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
