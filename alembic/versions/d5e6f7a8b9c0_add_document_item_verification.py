"""add verification/traceability fields to university_document_items

Adds condition, source_url, evidence_text, verification_status, verified_at
to university_document_items — Phase 2 of the university data verification
audit. All new columns are nullable/defaulted; no existing data (name,
is_required, order_index, degree_level) is touched or reinterpreted.

Existing rows are explicitly backfilled to verification_status='unverified'
— NOT 'verified'. Having a name and is_required value in the database does
not mean the requirement has ever been checked against an authoritative
source; that only happens per-university during the Phase 3 research batches.

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-08-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "d5e6f7a8b9c0"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns("university_document_items")}

    if "condition" not in cols:
        op.add_column("university_document_items", sa.Column("condition", sa.JSON(), nullable=True))
    if "source_url" not in cols:
        op.add_column("university_document_items", sa.Column("source_url", sa.String(500), nullable=True))
    if "evidence_text" not in cols:
        op.add_column("university_document_items", sa.Column("evidence_text", sa.Text(), nullable=True))
    if "verification_status" not in cols:
        op.add_column(
            "university_document_items",
            sa.Column("verification_status", sa.String(20), nullable=False, server_default="unverified"),
        )
        # Explicit backfill pass (belt-and-suspenders alongside server_default)
        # — makes the "existing data is unverified, not verified" decision
        # visible in the migration itself, not just implicit in a default.
        op.execute("UPDATE university_document_items SET verification_status = 'unverified' WHERE verification_status IS NULL")
    if "verified_at" not in cols:
        op.add_column("university_document_items", sa.Column("verified_at", sa.Date(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns("university_document_items")}
    for col in ("verified_at", "verification_status", "evidence_text", "source_url", "condition"):
        if col in cols:
            op.drop_column("university_document_items", col)
