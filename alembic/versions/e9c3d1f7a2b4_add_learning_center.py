"""add_learning_center

Revision ID: e9c3d1f7a2b4
Revises: d4f1c2a3b8e0
Create Date: 2026-06-20 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e9c3d1f7a2b4"
down_revision: Union[str, None] = "d4f1c2a3b8e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "placement_tests",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("language", sa.String(50), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "placement_test_questions",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("test_id", sa.Integer, sa.ForeignKey("placement_tests.id"), nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("options_json", sa.Text, nullable=True),
        sa.Column("correct_answer", sa.String(500), nullable=True),
        sa.Column("level", sa.String(10), nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("language", sa.String(50), nullable=False),
        sa.Column("level", sa.String(10), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("content_type", sa.String(20), nullable=True),
        sa.Column("content_url", sa.String(500), nullable=True),
        sa.Column("content_text", sa.Text, nullable=True),
        sa.Column("duration_minutes", sa.Integer, nullable=True),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("lessons")
    op.drop_table("courses")
    op.drop_table("placement_test_questions")
    op.drop_table("placement_tests")
