"""add instructors

Revision ID: f3a1c9e2d7b5
Revises: e9c3d1f7a2b4
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'f3a1c9e2d7b5'
down_revision = 'e9c3d1f7a2b4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'instructors',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('title', sa.String(50), nullable=True),
        sa.Column('language', sa.String(50), nullable=False),
        sa.Column('specialty', sa.String(150), nullable=True),
        sa.Column('organization', sa.String(150), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('email', sa.String(150), nullable=True),
        sa.Column('years_experience', sa.Integer(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('instructors')
