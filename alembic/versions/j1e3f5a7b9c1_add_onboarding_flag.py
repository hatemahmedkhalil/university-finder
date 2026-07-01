"""add onboarding flag to users

Revision ID: j1e3f5a7b9c1
Revises: i0d2e4f6a8b0
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'j1e3f5a7b9c1'
down_revision = 'i0d2e4f6a8b0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'users',
        sa.Column('has_completed_onboarding', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column('users', 'has_completed_onboarding')
