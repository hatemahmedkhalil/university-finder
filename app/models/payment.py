from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Payment(Base):
    """
    One row per Paymob payment intention. Created (status="pending") the
    moment we ask Paymob for a client_secret, then flipped to "paid" or
    "failed" only by the webhook — never by the client-side redirect, which
    is UX-only and not trusted for money state.

    paymob_order_id is unique and is what makes webhook delivery idempotent:
    Paymob may call the webhook more than once for the same transaction, and
    the handler must be a no-op the second time.
    """
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("subscription_plans.id"), nullable=False)

    # amount_cents / currency = what Paymob actually charged (EGP). Plan
    # prices are quoted in USD everywhere the user sees them, so
    # amount_usd_cents + fx_rate record what that EGP charge was meant to
    # equal at checkout time — needed for support/audit since the rate is a
    # static config value that changes over time, not a live feed.
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="EGP")
    amount_usd_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fx_rate: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Paymob's intention id, returned when we create the intention — this is
    # what we look up when the webhook arrives (Paymob's payload carries it
    # back as "order.id" / "intention_order_id" depending on payload shape).
    paymob_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True, index=True)
    paymob_transaction_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()  # noqa: F821
    plan: Mapped["SubscriptionPlan"] = relationship()  # noqa: F821

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'paid', 'failed')", name="ck_payment_status"),
    )
