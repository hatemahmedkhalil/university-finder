"""add phone_number to student_profile

Revision ID: m4h6i8j0k2l4
Revises: l3g5b7c9d1e3
Create Date: 2026-06-21
"""
from alembic import op
import sqlalchemy as sa

revision = "m4h6i8j0k2l4"
down_revision = "l3g5b7c9d1e3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "student_profiles",
        sa.Column("phone_number", sa.String(30), nullable=True),
    )


def downgrade():
    op.drop_column("student_profiles", "phone_number")
