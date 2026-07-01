"""add announcement reads

Revision ID: b3c5d7e9f0a2
Revises: a2b4c6d8e0f1
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'b3c5d7e9f0a2'
down_revision = 'a2b4c6d8e0f1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'announcement_reads',
        sa.Column('user_id',         sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('announcement_id', sa.Integer(), sa.ForeignKey('announcements.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('read_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('announcement_reads')
