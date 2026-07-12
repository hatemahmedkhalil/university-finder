"""add prev degree fields to student profiles

Revision ID: e1f2a3b4c5d6
Revises: de45260103eb
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'e1f2a3b4c5d6'
down_revision = 'de45260103eb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('student_profiles', sa.Column('prev_university', sa.String(200), nullable=True))
    op.add_column('student_profiles', sa.Column('prev_country', sa.String(100), nullable=True))
    op.add_column('student_profiles', sa.Column('prev_major', sa.String(200), nullable=True))
    op.add_column('student_profiles', sa.Column('graduation_year', sa.Integer(), nullable=True))
    op.add_column('student_profiles', sa.Column('prev_gpa', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('student_profiles', 'prev_gpa')
    op.drop_column('student_profiles', 'graduation_year')
    op.drop_column('student_profiles', 'prev_major')
    op.drop_column('student_profiles', 'prev_country')
    op.drop_column('student_profiles', 'prev_university')
