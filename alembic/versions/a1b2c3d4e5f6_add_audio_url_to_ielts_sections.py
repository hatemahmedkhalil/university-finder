"""add audio_url to ielts_sections

Revision ID: a1b2c3d4e5f6
Revises: z1a2b3c4d5e6
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'z1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('ielts_sections', sa.Column('audio_url', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('ielts_sections', 'audio_url')
