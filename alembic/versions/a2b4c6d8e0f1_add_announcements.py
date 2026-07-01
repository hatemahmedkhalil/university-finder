"""add announcements

Revision ID: a2b4c6d8e0f1
Revises: f3a1c9e2d7b5
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'a2b4c6d8e0f1'
down_revision = 'f3a1c9e2d7b5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('type', sa.String(20), nullable=False, server_default='info'),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('announcements')
