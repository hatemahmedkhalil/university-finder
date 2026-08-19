"""add university_deadlines table for auditable deadline evidence

Phase 3.5 — audit hardening. University.application_deadline (String(200))
has no source_url/evidence_text/verification_status/verified_at/condition
and cannot represent a university with genuinely programme-dependent
deadlines (e.g. Heidelberg, Goethe Frankfurt — confirmed during the Phase 3
pilot) without either fabricating a false single date or truncating real
nuance. This table lets a university have zero, one, or many auditable
deadline rows instead. University.application_deadline is left untouched —
existing consumers (parse_deadline()) are unaffected.

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-08-16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "e6f7a8b9c0d1"
down_revision = "d5e6f7a8b9c0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = inspect(bind).get_table_names()
    if "university_deadlines" in existing:
        return

    op.create_table(
        "university_deadlines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("university_id", sa.Integer(), sa.ForeignKey("universities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("label", sa.String(300), nullable=False),
        sa.Column("deadline_text", sa.String(300), nullable=False),
        sa.Column("cycle", sa.String(20), nullable=True),
        sa.Column("condition", sa.JSON(), nullable=True),
        sa.Column("source_url", sa.String(500), nullable=True),
        sa.Column("evidence_text", sa.Text(), nullable=True),
        sa.Column("verification_status", sa.String(20), nullable=False, server_default="unverified"),
        sa.Column("verified_at", sa.Date(), nullable=True),
    )
    op.create_index("ix_university_deadlines_university_id", "university_deadlines", ["university_id"])


def downgrade() -> None:
    bind = op.get_bind()
    existing = inspect(bind).get_table_names()
    if "university_deadlines" in existing:
        op.drop_table("university_deadlines")
