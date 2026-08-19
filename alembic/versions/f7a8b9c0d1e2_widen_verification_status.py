"""widen verification_status columns to String(30)

Phase 3 Batch 1 added two new statuses ('conflicting',
'needs_manual_verification') — the latter is 26 characters, exceeding the
original String(20) columns on university_document_items and
university_deadlines. Existing data untouched, purely a column-width change.

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-08-17
"""
from alembic import op
import sqlalchemy as sa

revision = "f7a8b9c0d1e2"
down_revision = "e6f7a8b9c0d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("university_document_items", "verification_status", type_=sa.String(30))
    op.alter_column("university_deadlines", "verification_status", type_=sa.String(30))


def downgrade() -> None:
    op.alter_column("university_document_items", "verification_status", type_=sa.String(20))
    op.alter_column("university_deadlines", "verification_status", type_=sa.String(20))
