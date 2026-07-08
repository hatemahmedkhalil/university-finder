"""add full_name to student profile

Revision ID: y7z8a9b0c1d2
Revises: x6y7z8a9b0c1
Create Date: 2026-07-07

"""
from alembic import op
import sqlalchemy as sa

revision = 'y7z8a9b0c1d2'
down_revision = 'f739d93e8523'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('student_profiles', sa.Column('full_name', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('student_profiles', 'full_name')
