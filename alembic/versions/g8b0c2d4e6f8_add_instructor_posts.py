"""add instructor posts

Revision ID: g8b0c2d4e6f8
Revises: f7a9b1c3d5e7
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'g8b0c2d4e6f8'
down_revision = 'f7a9b1c3d5e7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'instructor_posts',
        sa.Column('id',            sa.Integer(),  primary_key=True, index=True),
        sa.Column('instructor_id', sa.Integer(),  sa.ForeignKey('instructors.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('content',       sa.Text(),     nullable=False),
        sa.Column('created_at',    sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('instructor_posts')
