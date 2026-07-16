"""add simulator tables

Revision ID: c2d3e4f5a6b7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "c2d3e4f5a6b7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = inspect(bind).get_table_names()

    if "exam_passages" not in existing:
        op.create_table(
            "exam_passages",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("exam_type", sa.String(20), nullable=False),
            sa.Column("section", sa.String(30), nullable=False),
            sa.Column("title", sa.String(300), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("difficulty", sa.String(10), nullable=False, server_default="B2"),
            sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        )
        op.create_index("ix_exam_passages_id", "exam_passages", ["id"])

    if "exam_questions" not in existing:
        op.create_table(
            "exam_questions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("exam_type", sa.String(20), nullable=False),
            sa.Column("section", sa.String(30), nullable=False),
            sa.Column("subsection", sa.String(50), nullable=True),
            sa.Column("question_type", sa.String(30), nullable=False, server_default="mcq"),
            sa.Column("passage_id", sa.Integer(), sa.ForeignKey("exam_passages.id", ondelete="CASCADE"), nullable=True),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("options_json", sa.Text(), nullable=True),
            sa.Column("correct_answer", sa.Text(), nullable=True),
            sa.Column("explanation", sa.Text(), nullable=True),
            sa.Column("points", sa.Float(), nullable=False, server_default="1.0"),
            sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        )
        op.create_index("ix_exam_questions_id", "exam_questions", ["id"])
        op.create_index("ix_exam_questions_passage_id", "exam_questions", ["passage_id"])

    if "simulator_attempts" not in existing:
        op.create_table(
            "simulator_attempts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("exam_type", sa.String(20), nullable=False),
            sa.Column("status", sa.String(20), nullable=False, server_default="in_progress"),
            sa.Column("started_at", sa.DateTime(), server_default=sa.text("now()")),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("overall_score", sa.Float(), nullable=True),
            sa.Column("score_band", sa.String(20), nullable=True),
            sa.Column("score_breakdown", sa.Text(), nullable=True),
            sa.Column("score_report", sa.Text(), nullable=True),
        )
        op.create_index("ix_simulator_attempts_id", "simulator_attempts", ["id"])
        op.create_index("ix_simulator_attempts_user_id", "simulator_attempts", ["user_id"])

    if "simulator_section_results" not in existing:
        op.create_table(
            "simulator_section_results",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("attempt_id", sa.Integer(), sa.ForeignKey("simulator_attempts.id", ondelete="CASCADE"), nullable=False),
            sa.Column("section_name", sa.String(50), nullable=False),
            sa.Column("answers", sa.Text(), nullable=True),
            sa.Column("raw_score", sa.Float(), nullable=True),
            sa.Column("scaled_score", sa.Float(), nullable=True),
            sa.Column("band", sa.String(10), nullable=True),
            sa.Column("feedback", sa.Text(), nullable=True),
            sa.Column("time_spent", sa.Integer(), nullable=True),
            sa.Column("submitted_at", sa.DateTime(), server_default=sa.text("now()")),
        )
        op.create_index("ix_simulator_section_results_id", "simulator_section_results", ["id"])
        op.create_index("ix_simulator_section_results_attempt_id", "simulator_section_results", ["attempt_id"])


def downgrade() -> None:
    op.drop_table("simulator_section_results")
    op.drop_table("simulator_attempts")
    op.drop_table("exam_questions")
    op.drop_table("exam_passages")
