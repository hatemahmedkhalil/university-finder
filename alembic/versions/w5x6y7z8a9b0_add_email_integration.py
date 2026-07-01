"""add email integration tables

Revision ID: w5x6y7z8a9b0
Revises: v4w5x6y7z8a9
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = "w5x6y7z8a9b0"
down_revision = "v4w5x6y7z8a9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "linked_emails",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("linked_email", sa.String(255), nullable=False),
        sa.Column("consent_given_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consent_ip", sa.String(50), nullable=True),
        sa.Column("consent_version", sa.String(20), nullable=False, server_default="1.0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("forwarding_confirmed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "inbound_emails",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("from_address", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False, server_default=""),
        sa.Column("body_preview", sa.String(500), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("detected_university", sa.String(200), nullable=True),
        sa.Column("detected_status", sa.String(50), nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
    )


def downgrade():
    op.drop_table("inbound_emails")
    op.drop_table("linked_emails")
