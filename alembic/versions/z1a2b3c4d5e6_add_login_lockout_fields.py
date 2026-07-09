"""add login lockout fields

Revision ID: z1a2b3c4d5e6
Revises: y7z8a9b0c1d2
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = 'z1a2b3c4d5e6'
down_revision = 'y7z8a9b0c1d2'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
