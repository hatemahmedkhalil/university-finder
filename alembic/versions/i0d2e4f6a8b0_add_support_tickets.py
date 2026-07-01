"""add support tickets

Revision ID: i0d2e4f6a8b0
Revises: h9c1d3e5f7a9
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'i0d2e4f6a8b0'
down_revision = 'h9c1d3e5f7a9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'support_tickets',
        sa.Column('id',          sa.Integer(),    primary_key=True, index=True),
        sa.Column('user_id',     sa.Integer(),    sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('subject',     sa.String(200),  nullable=False),
        sa.Column('message',     sa.Text(),       nullable=False),
        sa.Column('status',      sa.String(20),   nullable=False, server_default='open'),
        sa.Column('admin_reply', sa.Text(),       nullable=True),
        sa.Column('replied_at',  sa.DateTime(),   nullable=True),
        sa.Column('created_at',  sa.DateTime(),   nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',  sa.DateTime(),   nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('support_tickets')
