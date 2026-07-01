"""add notifications and ticket messages

Revision ID: l3g5b7c9d1e3
Revises: k2f4a6b8c0d2
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = "l3g5b7c9d1e3"
down_revision = "k2f4a6b8c0d2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False, server_default="system"),
        sa.Column("reference_id", sa.Integer(), nullable=True),
        sa.Column("reference_type", sa.String(50), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )

    op.create_table(
        "ticket_messages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("sender_role", sa.String(10), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )

    # Add new status values support to support_tickets (no-op for varchar — values enforced in app)
    # Add waiting_admin | waiting_student | closed statuses — existing open|in_progress|resolved still valid


def downgrade():
    op.drop_table("ticket_messages")
    op.drop_table("notifications")
