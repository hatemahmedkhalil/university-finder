"""add application pipeline

Revision ID: t2u3v4w5x6y7
Revises: s1t2u3v4w5x6
Create Date: 2026-06-30 11:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 't2u3v4w5x6y7'
down_revision = 's1t2u3v4w5x6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'application_pipeline',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('university_id', sa.Integer(), sa.ForeignKey('universities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='shortlisted'),
        sa.Column('fit_score', sa.Integer(), nullable=True),
        sa.Column('fit_analysis', sa.Text(), nullable=True),
        sa.Column('fit_gaps', sa.Text(), nullable=True),      # JSON array
        sa.Column('motivation_letter', sa.Text(), nullable=True),
        sa.Column('checklist', sa.Text(), nullable=True),     # JSON array
        sa.Column('deadline_note', sa.String(200), nullable=True),
        sa.Column('decision', sa.String(20), nullable=True),  # accepted/rejected/waitlisted
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.UniqueConstraint('user_id', 'university_id', name='uq_pipeline_user_uni'),
    )


def downgrade() -> None:
    op.drop_table('application_pipeline')
