"""add token_version and verification_token_expires to users

Revision ID: q8l0m2n4o6p8
Revises: p7k9l1m3n5o7
Create Date: 2026-06-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'q8l0m2n4o6p8'
down_revision = '2bf247d09d53'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('verification_token_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'token_version')
    op.drop_column('users', 'verification_token_expires')
