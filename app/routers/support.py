from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.limiter import limiter

from app.dependencies import get_db, get_current_user, require_admin
from app.models.support_ticket import SupportTicket
from app.models.ticket_message import TicketMessage
from app.models.announcement import Announcement
from app.models.user import User
from app.services.notify import create_notification

router = APIRouter(prefix="/support", tags=["Support"])

VALID_STATUSES = ("open", "waiting_admin", "waiting_student", "in_progress", "resolved", "closed")


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserSnap(BaseModel):
    id: int
    email: str
    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    sender_role: str
    message: str
    created_at: datetime
    model_config = {"from_attributes": True}


class TicketOut(BaseModel):
    id: int
    user_id: int
    subject: str
    message: str
    status: str
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user: UserSnap
    conversation: list[MessageOut] = []
    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=5000)


class ReplyBody(BaseModel):
    reply: str = Field(min_length=1, max_length=5000)
    status: Optional[str] = "waiting_student"


class MessageBody(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class StatusUpdate(BaseModel):
    status: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_ticket(db: Session, ticket_id: int) -> SupportTicket:
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _attach_conversation(db: Session, ticket: SupportTicket) -> TicketOut:
    messages = (
        db.query(TicketMessage)
        .filter(TicketMessage.ticket_id == ticket.id)
        .order_by(TicketMessage.created_at.asc())
        .all()
    )
    out = TicketOut.model_validate(ticket)
    out.conversation = [MessageOut.model_validate(m) for m in messages]
    return out


# ── Student endpoints ─────────────────────────────────────────────────────────

@router.post("", response_model=TicketOut, status_code=201)
@limiter.limit("5/minute")
def submit_ticket(
    request: Request,
    body: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.subject.strip() or not body.message.strip():
        raise HTTPException(status_code=400, detail="Subject and message are required")
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=body.subject.strip(),
        message=body.message.strip(),
        status="waiting_admin",
    )
    db.add(ticket)
    db.flush()

    # Save initial student message to conversation thread
    db.add(TicketMessage(
        ticket_id=ticket.id,
        sender_role="student",
        message=body.message.strip(),
    ))
    db.commit()
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket.id).first()
    return _attach_conversation(db, ticket)


@router.post("/{ticket_id}/message", response_model=TicketOut)
def student_followup(
    ticket_id: int,
    body: MessageBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student sends a follow-up message on an existing ticket."""
    ticket = _load_ticket(db, ticket_id)
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your ticket")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message required")

    db.add(TicketMessage(
        ticket_id=ticket.id,
        sender_role="student",
        message=body.message.strip(),
    ))
    ticket.status = "waiting_admin"
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    ticket = _load_ticket(db, ticket_id)
    return _attach_conversation(db, ticket)


@router.get("/my", response_model=list[TicketOut])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tickets = (
        db.query(SupportTicket)
        .filter(SupportTicket.user_id == current_user.id)
        .order_by(SupportTicket.created_at.desc())
        .all()
    )
    return [_attach_conversation(db, t) for t in tickets]


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("", response_model=list[TicketOut])
def admin_list_tickets(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    tickets = (
        db.query(SupportTicket)
        .order_by(SupportTicket.created_at.desc())
        .all()
    )
    return [_attach_conversation(db, t) for t in tickets]


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total           = db.query(SupportTicket).count()
    open_count      = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
    waiting_admin   = db.query(SupportTicket).filter(SupportTicket.status == "waiting_admin").count()
    waiting_student = db.query(SupportTicket).filter(SupportTicket.status == "waiting_student").count()
    in_prog         = db.query(SupportTicket).filter(SupportTicket.status == "in_progress").count()
    resolved        = db.query(SupportTicket).filter(SupportTicket.status == "resolved").count()
    closed          = db.query(SupportTicket).filter(SupportTicket.status == "closed").count()
    return {
        "total": total,
        "open": open_count,
        "waiting_admin": waiting_admin,
        "waiting_student": waiting_student,
        "in_progress": in_prog,
        "resolved": resolved,
        "closed": closed,
    }


@router.get("/{ticket_id}", response_model=TicketOut)
def admin_get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ticket = _load_ticket(db, ticket_id)
    return _attach_conversation(db, ticket)


@router.post("/{ticket_id}/reply", response_model=TicketOut)
def admin_reply(
    ticket_id: int,
    body: ReplyBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ticket = _load_ticket(db, ticket_id)
    reply_text = body.reply.strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    # Save to conversation thread
    db.add(TicketMessage(
        ticket_id=ticket.id,
        sender_role="admin",
        message=reply_text,
    ))

    # Update ticket (keep admin_reply for backward compat)
    ticket.admin_reply = reply_text
    ticket.replied_at = datetime.now(timezone.utc)
    ticket.status = body.status or "waiting_student"
    ticket.updated_at = datetime.now(timezone.utc)

    # Per-user notification
    create_notification(
        db,
        user_id=ticket.user_id,
        title="💬 Support replied to your ticket",
        message=f'Your support ticket "{ticket.subject}" has received a reply from our team.',
        type="support_reply",
        reference_id=ticket.id,
        reference_type="ticket",
    )

    # Legacy announcement (keeps bell badge visible)
    ann = Announcement(
        title="💬 Support replied to your ticket",
        body=f'Your support ticket "{ticket.subject}" has received a reply. Go to the Support page to read it.',
        type="success",
        is_published=True,
        target_user_id=ticket.user_id,
    )
    db.add(ann)
    db.commit()
    ticket = _load_ticket(db, ticket_id)
    return _attach_conversation(db, ticket)


@router.patch("/{ticket_id}/status", response_model=TicketOut)
def admin_update_status(
    ticket_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {', '.join(VALID_STATUSES)}")
    ticket = _load_ticket(db, ticket_id)
    ticket.status = body.status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    ticket = _load_ticket(db, ticket_id)
    return _attach_conversation(db, ticket)


@router.delete("/{ticket_id}", status_code=204)
def admin_delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    ticket = _load_ticket(db, ticket_id)
    db.delete(ticket)
    db.commit()
