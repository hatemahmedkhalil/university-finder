"""
Paymob (Egypt) payment gateway — Intention API integration.

Flow:
  1. create_intention() — merchant backend calls Paymob with amount + billing
     data, gets back a client_secret.
  2. Frontend redirects the user to unified_checkout_url(client_secret) —
     Paymob's hosted checkout page. We never see card details.
  3. Paymob calls our webhook with the transaction result. verify_hmac()
     MUST pass before that payload is trusted for anything.

Docs: https://developers.paymob.com/egypt/checkout/integration-guide-and-api-reference/intention-payment-api
      https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac/hmac-for-card-tokens
"""
import hashlib
import hmac
import logging

import httpx

from app.config import settings

logger = logging.getLogger("university_finder")


def paymob_configured() -> bool:
    return bool(settings.PAYMOB_SECRET_KEY and settings.PAYMOB_PUBLIC_KEY and settings.PAYMOB_HMAC_SECRET)


def create_intention(
    amount_cents: int,
    currency: str,
    billing_data: dict,
    extras: dict,
    redirection_url: str | None = None,
) -> dict:
    """
    Creates a Paymob payment intention. Returns the raw Paymob response
    (contains "id" and "client_secret" among other fields).

    redirection_url is where the customer's browser lands after paying
    (card/wallet only) — Paymob appends its own transaction query params to
    it. This is UX only; the webhook (notification_url, set once in the
    Paymob dashboard) is still the source of truth for payment state.

    Raises httpx.HTTPStatusError on a non-2xx response from Paymob — callers
    should catch this and surface a generic error to the user, never the
    raw Paymob error body (may contain account-identifying details).
    """
    payload = {
        "amount": amount_cents,
        "currency": currency,
        "payment_methods": settings.PAYMOB_INTEGRATION_IDS,
        "billing_data": billing_data,
        "extras": extras,
    }
    if redirection_url:
        payload["redirection_url"] = redirection_url

    resp = httpx.post(
        f"{settings.PAYMOB_BASE_URL}/v1/intention/",
        headers={"Authorization": f"Token {settings.PAYMOB_SECRET_KEY}"},
        json=payload,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def unified_checkout_url(client_secret: str) -> str:
    return f"{settings.PAYMOB_BASE_URL}/unifiedcheckout/?publicKey={settings.PAYMOB_PUBLIC_KEY}&clientSecret={client_secret}"


# Field order Paymob specifies for the transaction-processed callback HMAC.
# Must match exactly — see the "HMAC Calculated" section of Paymob's docs.
_TRANSACTION_HMAC_FIELDS = [
    "amount_cents", "created_at", "currency", "error_occured",
    "has_parent_transaction", "id", "integration_id", "is_3d_secure",
    "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
    "is_voided", "order.id", "owner", "pending", "source_data.pan",
    "source_data.sub_type", "source_data.type", "success",
]


def _dig(payload: dict, dotted_key: str):
    node = payload
    for part in dotted_key.split("."):
        if not isinstance(node, dict) or part not in node:
            return ""
        node = node[part]
    return node


def verify_hmac(transaction: dict, received_hmac: str) -> bool:
    """
    Recomputes the HMAC-SHA512 over the transaction payload's fixed field
    list and compares it (constant-time) against the hmac query param
    Paymob sends alongside the callback. Fails closed: if the secret isn't
    configured, this always returns False rather than skipping the check.
    """
    if not settings.PAYMOB_HMAC_SECRET or not received_hmac:
        return False

    concatenated = "".join(str(_dig(transaction, key)) for key in _TRANSACTION_HMAC_FIELDS)
    computed = hmac.new(
        settings.PAYMOB_HMAC_SECRET.encode("utf-8"),
        concatenated.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(computed, received_hmac)
