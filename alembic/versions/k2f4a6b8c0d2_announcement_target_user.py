"""announcement target user

Revision ID: k2f4a6b8c0d2
Revises: j1e3f5a7b9c1
Create Date: 2026-06-20

"""
from alembic import op
import sqlalchemy as sa

revision = "k2f4a6b8c0d2"
down_revision = "j1e3f5a7b9c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "announcements",
        sa.Column(
            "target_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )


def downgrade():
    op.drop_column("announcements", "target_user_id")
