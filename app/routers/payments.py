import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.payment import Payment
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User
from app.services.paymob import create_intention, paymob_configured, unified_checkout_url, verify_hmac

logger = logging.getLogger("university_finder")

router = APIRouter(prefix="/payments", tags=["Payments"])


class CheckoutRequest(BaseModel):
    plan_id: int


class CheckoutResponse(BaseModel):
    checkout_url: str
    payment_id: int


@router.post("/checkout", response_model=CheckoutResponse)
@limiter.limit("10/minute")
def start_checkout(
    request: Request,
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not paymob_configured():
        raise HTTPException(status_code=503, detail="Payments are not available right now.")

    plan = db.query(SubscriptionPlan).filter(
        SubscriptionPlan.id == body.plan_id, SubscriptionPlan.is_active == True,  # noqa: E712
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if not plan.price or plan.price <= 0:
        raise HTTPException(status_code=400, detail="This plan does not require payment")

    # Plan price is quoted in USD; Paymob (this account) only settles in
    # EGP, so convert right before charging. The user only ever sees USD.
    amount_usd_cents = int(round(plan.price * 100))
    amount_cents = int(round(plan.price * settings.USD_TO_EGP_RATE * 100))

    payment = Payment(
        user_id=current_user.id,
        plan_id=plan.id,
        amount_cents=amount_cents,
        currency=settings.PAYMOB_CURRENCY,
        amount_usd_cents=amount_usd_cents,
        fx_rate=settings.USD_TO_EGP_RATE,
        status="pending",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    name_parts = (current_user.email.split("@")[0] or "Student").split(".")
    try:
        intention = create_intention(
            amount_cents=amount_cents,
            currency=settings.PAYMOB_CURRENCY,
            billing_data={
                "apartment": "NA", "floor": "NA", "building": "NA", "street": "NA",
                "city": "NA", "country": "EG", "state": "NA",
                "first_name": name_parts[0].title(),
                "last_name": (name_parts[1].title() if len(name_parts) > 1 else "Student"),
                "email": current_user.email,
                "phone_number": "+20000000000",
            },
            extras={
                "payment_id": payment.id, "user_id": current_user.id, "plan_id": plan.id,
                "amount_usd_cents": amount_usd_cents, "fx_rate": settings.USD_TO_EGP_RATE,
            },
            redirection_url=f"{settings.FRONTEND_URL}/payments/return?payment_id={payment.id}",
        )
    except httpx.HTTPError as e:
        logger.error("Paymob create_intention failed for payment_id=%s: %s", payment.id, e)
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail="Could not start checkout. Please try again.")

    # Store the numeric order id, NOT intention["id"] (a separate "pi_test_..."
    # string) — the webhook's payload carries order.id, which matches
    # intention_order_id, not the intention id. Confirmed against a live
    # sandbox response: {"id": "pi_test_...", "intention_order_id": 585541337}
    # are two different identifiers for the same intention.
    payment.paymob_order_id = str(intention.get("intention_order_id") or intention.get("id") or "")
    db.commit()

    return CheckoutResponse(
        checkout_url=unified_checkout_url(intention["client_secret"]),
        payment_id=payment.id,
    )


@router.post("/webhook", include_in_schema=False)
async def paymob_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Called by Paymob after a transaction is processed. Fails closed: if the
    HMAC secret isn't configured, or verification fails for any reason, the
    request is rejected — this must never silently accept an unverified
    payload (see the EMAIL_WEBHOOK_SECRET fail-open bug fixed earlier; this
    endpoint is written to not repeat that mistake).
    """
    if not settings.PAYMOB_HMAC_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    received_hmac = request.query_params.get("hmac", "")
    body = await request.json()
    transaction = body.get("obj", {})

    if not verify_hmac(transaction, received_hmac):
        logger.warning("Paymob webhook: HMAC verification failed")
        raise HTTPException(status_code=403, detail="Invalid signature")

    order_id = str((transaction.get("order") or {}).get("id", ""))
    # Paymob sends these as the literal strings "true"/"false" — bool("false")
    # is True in Python, so a naive bool() cast here would treat every
    # declined/pending transaction as successful. Parse the string explicitly.
    success = str(transaction.get("success")).lower() == "true"
    pending = str(transaction.get("pending")).lower() == "true"

    payment = db.query(Payment).filter(Payment.paymob_order_id == order_id).first()
    if not payment:
        logger.warning("Paymob webhook: no matching payment for order_id=%s", order_id)
        return {"received": True}

    # Idempotent: a payment already marked paid/failed is never re-processed,
    # since Paymob may deliver the same callback more than once.
    if payment.status != "pending":
        return {"received": True}

    if pending:
        return {"received": True}

    payment.paymob_transaction_id = str(transaction.get("id", ""))

    if success:
        payment.status = "paid"
        payment.paid_at = datetime.now(timezone.utc)

        user = db.get(User, payment.user_id)
        plan = db.get(SubscriptionPlan, payment.plan_id)
        if user and plan:
            user.plan = plan.name.lower()
            if plan.duration_days:
                # Extend from the later of "now" or the current expiry, so a
                # renewal paid before expiry stacks instead of losing days.
                base = user.plan_expires_at if (user.plan_expires_at and user.plan_expires_at > datetime.now(timezone.utc)) else datetime.now(timezone.utc)
                user.plan_expires_at = base + timedelta(days=plan.duration_days)
    else:
        payment.status = "failed"

    db.commit()
    return {"received": True}


class PaymentStatusOut(BaseModel):
    status: str
    plan_name: str
    model_config = {"from_attributes": True}


@router.get("/{payment_id}/status", response_model=PaymentStatusOut)
def get_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Polled by the frontend on the checkout-return page to learn whether
    the webhook has already landed (it usually beats the browser redirect,
    but not always)."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id, Payment.user_id == current_user.id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentStatusOut(status=payment.status, plan_name=payment.plan.name)
