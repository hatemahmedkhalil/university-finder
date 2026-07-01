"""add ielts simulator tables

Revision ID: r9m1n3o5p7q9
Revises: q8l0m2n4o6p8
Create Date: 2026-06-28 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'r9m1n3o5p7q9'
down_revision = 'q8l0m2n4o6p8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'ielts_tests',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='170'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_table(
        'ielts_sections',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('test_id', sa.Integer(), sa.ForeignKey('ielts_tests.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_table(
        'ielts_questions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('section_id', sa.Integer(), sa.ForeignKey('ielts_sections.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(30), nullable=False, server_default='multiple_choice'),
        sa.Column('options_json', sa.Text(), nullable=True),
        sa.Column('correct_answer', sa.Text(), nullable=True),
        sa.Column('marks', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade() -> None:
    op.drop_table('ielts_questions')
    op.drop_table('ielts_sections')
    op.drop_table('ielts_tests')
