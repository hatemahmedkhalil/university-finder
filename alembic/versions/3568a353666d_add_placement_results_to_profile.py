"""add_placement_results_to_profile

Revision ID: 3568a353666d
Revises: 418de79d3f37
Create Date: 2026-06-21 11:13:50.259107

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = '3568a353666d'
down_revision: Union[str, None] = '418de79d3f37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('student_profiles', sa.Column('placement_results', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('student_profiles', 'placement_results')
