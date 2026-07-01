"""add application guide to universities

Revision ID: u3v4w5x6y7z8
Revises: t2u3v4w5x6y7
Create Date: 2026-06-30 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'u3v4w5x6y7z8'
down_revision = 't2u3v4w5x6y7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('universities', sa.Column('application_guide', sa.Text(), nullable=True))
    op.add_column('universities', sa.Column('guide_generated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('universities', 'guide_generated_at')
    op.drop_column('universities', 'application_guide')
