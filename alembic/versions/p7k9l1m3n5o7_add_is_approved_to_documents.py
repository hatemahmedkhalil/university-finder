"""add is_approved to application_documents

Revision ID: p7k9l1m3n5o7
Revises: o6j8k0l2m4n6
Create Date: 2026-06-23 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'p7k9l1m3n5o7'
down_revision = 'o6j8k0l2m4n6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('application_documents', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('application_documents', 'is_approved')
