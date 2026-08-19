"""Payment (Paymob) integration tests: checkout intention creation, webhook
HMAC verification, idempotency, and plan-expiry downgrade."""
import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import pytest

from app.config import settings
from app.models.payment import Payment
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User
from app.services.plan_expiry import run_plan_expiry


def _make_plan(db, name="Premium", price=100.0, duration_days=30):
    plan = SubscriptionPlan(name=name, price=price, duration_days=duration_days, is_active=True)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _sign(transaction: dict, secret: str) -> str:
    from app.services.paymob import _TRANSACTION_HMAC_FIELDS, _dig
    concatenated = "".join(str(_dig(transaction, key)) for key in _TRANSACTION_HMAC_FIELDS)
    return hmac.new(secret.encode(), concatenated.encode(), hashlib.sha512).hexdigest()


def _transaction_payload(order_id: str, success: bool = True, pending: bool = False, txn_id: str = "999"):
    return {
        "amount_cents": "10000", "created_at": "2026-01-01", "currency": "EGP",
        "error_occured": "false", "has_parent_transaction": "false", "id": txn_id,
        "integration_id": "1", "is_3d_secure": "true", "is_auth": "false",
        "is_capture": "false", "is_refunded": "false", "is_standalone_payment": "true",
        "is_voided": "false", "order": {"id": order_id}, "owner": "1",
        "pending": str(pending).lower(), "source_data": {"pan": "1234", "sub_type": "Visa", "type": "card"},
        "success": str(success).lower(),
    }


# ── checkout ────────────────────────────────────────────────────────────────

def test_checkout_fails_when_paymob_not_configured(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_SECRET_KEY", "", raising=False)
    plan = _make_plan(db)
    r = client.post("/payments/checkout", json={"plan_id": plan.id}, headers=student_headers)
    assert r.status_code == 503


def test_checkout_rejects_unknown_plan(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_SECRET_KEY", "k", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_PUBLIC_KEY", "pk", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "hs", raising=False)
    r = client.post("/payments/checkout", json={"plan_id": 999999}, headers=student_headers)
    assert r.status_code == 404


def test_checkout_rejects_free_plan(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_SECRET_KEY", "k", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_PUBLIC_KEY", "pk", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "hs", raising=False)
    plan = _make_plan(db, name="Free", price=None, duration_days=None)
    r = client.post("/payments/checkout", json={"plan_id": plan.id}, headers=student_headers)
    assert r.status_code == 400


def test_checkout_creates_pending_payment_and_returns_url(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_SECRET_KEY", "k", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_PUBLIC_KEY", "pk", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "hs", raising=False)
    monkeypatch.setattr(settings, "USD_TO_EGP_RATE", 50.0, raising=False)
    plan = _make_plan(db)

    import app.routers.payments as payments_router
    monkeypatch.setattr(
        payments_router, "create_intention",
        # Mirrors Paymob's real shape: "id" (intention id, "pi_test_...") and
        # "intention_order_id" (numeric) are different fields — regression
        # test for a bug where the wrong one was stored/matched by the webhook.
        lambda **kwargs: {"id": "pi_test_abc", "intention_order_id": 585541337, "client_secret": "secret-xyz"},
    )

    r = client.post("/payments/checkout", json={"plan_id": plan.id}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert "secret-xyz" in body["checkout_url"]

    payment = db.query(Payment).filter(Payment.id == body["payment_id"]).first()
    assert payment is not None
    assert payment.status == "pending"
    # Must match intention_order_id, NOT the intention's "id" field — that's
    # what the webhook's order.id will actually carry back.
    assert payment.paymob_order_id == "585541337"
    # Plan price ($100) is quoted in USD; the actual Paymob charge is
    # converted to EGP at checkout time (100 * 50.0 rate = 5000 EGP).
    assert payment.amount_usd_cents == 10000
    assert payment.amount_cents == 500000
    assert payment.fx_rate == 50.0
    assert payment.currency == "EGP"


def test_checkout_marks_payment_failed_on_paymob_error(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_SECRET_KEY", "k", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_PUBLIC_KEY", "pk", raising=False)
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "hs", raising=False)
    plan = _make_plan(db)

    import httpx
    import app.routers.payments as payments_router

    def _boom(**kwargs):
        raise httpx.HTTPStatusError("boom", request=None, response=None)

    monkeypatch.setattr(payments_router, "create_intention", _boom)

    r = client.post("/payments/checkout", json={"plan_id": plan.id}, headers=student_headers)
    assert r.status_code == 502

    payment = db.query(Payment).order_by(Payment.id.desc()).first()
    assert payment.status == "failed"


# ── webhook ─────────────────────────────────────────────────────────────────

def test_webhook_rejects_when_not_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "", raising=False)
    r = client.post("/payments/webhook?hmac=whatever", json={"obj": {}})
    assert r.status_code == 503


def test_webhook_rejects_bad_signature(client, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "correct-secret", raising=False)
    payload = _transaction_payload("order-1")
    r = client.post("/payments/webhook?hmac=totally-wrong", json={"obj": payload})
    assert r.status_code == 403


def test_webhook_marks_payment_paid_and_upgrades_user(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "correct-secret", raising=False)
    plan = _make_plan(db, name="Premium", price=100.0, duration_days=30)

    from app.core.security import decode_token
    token = student_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")
    user = db.query(User).filter(User.id == int(user_id)).first()

    payment = Payment(user_id=user.id, plan_id=plan.id, amount_cents=10000, currency="EGP",
                       status="pending", paymob_order_id="order-42")
    db.add(payment)
    db.commit()

    payload = _transaction_payload("order-42", success=True)
    sig = _sign(payload, "correct-secret")

    r = client.post(f"/payments/webhook?hmac={sig}", json={"obj": payload})
    assert r.status_code == 200

    db.refresh(payment)
    assert payment.status == "paid"
    assert payment.paid_at is not None

    db.refresh(user)
    assert user.plan == "premium"
    assert user.plan_expires_at is not None
    # SQLite (test DB only) doesn't preserve tzinfo on round-trip, unlike
    # Postgres — normalize before comparing so this isn't a false failure.
    expires_at = user.plan_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    assert expires_at > datetime.now(timezone.utc)


def test_webhook_is_idempotent(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "correct-secret", raising=False)
    plan = _make_plan(db, duration_days=30)

    from app.core.security import decode_token
    token = student_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")
    user = db.query(User).filter(User.id == int(user_id)).first()

    payment = Payment(user_id=user.id, plan_id=plan.id, amount_cents=10000, currency="EGP",
                       status="pending", paymob_order_id="order-idem")
    db.add(payment)
    db.commit()

    payload = _transaction_payload("order-idem", success=True)
    sig = _sign(payload, "correct-secret")

    r1 = client.post(f"/payments/webhook?hmac={sig}", json={"obj": payload})
    assert r1.status_code == 200
    db.refresh(user)
    first_expiry = user.plan_expires_at

    # Second delivery of the same callback must not extend the plan again.
    r2 = client.post(f"/payments/webhook?hmac={sig}", json={"obj": payload})
    assert r2.status_code == 200
    db.refresh(user)
    assert user.plan_expires_at == first_expiry


def test_webhook_marks_payment_failed_on_unsuccessful_transaction(client, db, student_headers, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "correct-secret", raising=False)
    plan = _make_plan(db)

    from app.core.security import decode_token
    token = student_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")
    user = db.query(User).filter(User.id == int(user_id)).first()

    payment = Payment(user_id=user.id, plan_id=plan.id, amount_cents=10000, currency="EGP",
                       status="pending", paymob_order_id="order-declined")
    db.add(payment)
    db.commit()

    payload = _transaction_payload("order-declined", success=False)
    sig = _sign(payload, "correct-secret")

    r = client.post(f"/payments/webhook?hmac={sig}", json={"obj": payload})
    assert r.status_code == 200

    db.refresh(payment)
    assert payment.status == "failed"
    db.refresh(user)
    assert user.plan == "free"


def test_webhook_ignores_pending_transaction(client, db, monkeypatch):
    monkeypatch.setattr(settings, "PAYMOB_HMAC_SECRET", "correct-secret", raising=False)
    plan = _make_plan(db)
    payment = Payment(user_id=1, plan_id=plan.id, amount_cents=10000, currency="EGP",
                       status="pending", paymob_order_id="order-pending")
    db.add(payment)
    db.commit()

    payload = _transaction_payload("order-pending", success=False, pending=True)
    sig = _sign(payload, "correct-secret")

    r = client.post(f"/payments/webhook?hmac={sig}", json={"obj": payload})
    assert r.status_code == 200
    db.refresh(payment)
    assert payment.status == "pending"


# ── payment status polling ──────────────────────────────────────────────────

def test_get_payment_status_scoped_to_owner(client, db, student_headers, admin_headers):
    plan = _make_plan(db)
    from app.core.security import decode_token
    token = student_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")

    payment = Payment(user_id=int(user_id), plan_id=plan.id, amount_cents=10000, currency="EGP", status="paid")
    db.add(payment)
    db.commit()
    db.refresh(payment)

    r_owner = client.get(f"/payments/{payment.id}/status", headers=student_headers)
    assert r_owner.status_code == 200
    assert r_owner.json()["status"] == "paid"

    # A different user cannot see someone else's payment status (IDOR check).
    r_other = client.get(f"/payments/{payment.id}/status", headers=admin_headers)
    assert r_other.status_code == 404


# ── plan expiry job ──────────────────────────────────────────────────────────

def test_plan_expiry_downgrades_expired_users(db, student_headers):
    from app.core.security import decode_token
    token = student_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")
    user = db.query(User).filter(User.id == int(user_id)).first()

    user.plan = "premium"
    user.plan_expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()

    result = run_plan_expiry()
    assert result["downgraded"] >= 1

    db.refresh(user)
    assert user.plan == "free"
    assert user.plan_expires_at is None


def test_plan_expiry_leaves_active_plans_alone(db, admin_headers):
    from app.core.security import decode_token
    token = admin_headers["Authorization"].split(" ")[1]
    user_id, _ = decode_token(token, "access")
    user = db.query(User).filter(User.id == int(user_id)).first()

    user.plan = "premium"
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=10)
    db.commit()

    run_plan_expiry()

    db.refresh(user)
    assert user.plan == "premium"
