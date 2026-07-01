"""add instructor messages

Revision ID: d5e7f9a1b3c5
Revises: c4d6e8f0a1b3
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'd5e7f9a1b3c5'
down_revision = 'c4d6e8f0a1b3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'instructor_messages',
        sa.Column('id',            sa.Integer(),  primary_key=True, index=True),
        sa.Column('instructor_id', sa.Integer(),  sa.ForeignKey('instructors.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id',       sa.Integer(),  sa.ForeignKey('users.id',       ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('question',      sa.Text(),     nullable=False),
        sa.Column('reply',         sa.Text(),     nullable=True),
        sa.Column('replied_at',    sa.DateTime(), nullable=True),
        sa.Column('created_at',    sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('instructor_messages')
