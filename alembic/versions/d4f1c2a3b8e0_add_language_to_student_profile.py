"""add_language_to_student_profile

Revision ID: d4f1c2a3b8e0
Revises: bcb0be2e0b3d
Create Date: 2026-06-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d4f1c2a3b8e0"
down_revision: Union[str, None] = "bcb0be2e0b3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "student_profiles",
        sa.Column("language", sa.String(50), nullable=False, server_default="english"),
    )


def downgrade() -> None:
    op.drop_column("student_profiles", "language")
