"""add_study_language_dormitory_semester_fee_notes_to_universities

Revision ID: 2bf247d09d53
Revises: p7k9l1m3n5o7
Create Date: 2026-06-25 07:44:12.287307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '2bf247d09d53'
down_revision: Union[str, None] = 'p7k9l1m3n5o7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('universities', sa.Column('study_language', sa.String(length=100), nullable=True))
    op.add_column('universities', sa.Column('dormitory_cost_eur', sa.Integer(), nullable=True))
    op.add_column('universities', sa.Column('semester_fee_eur', sa.Integer(), nullable=True))
    op.add_column('universities', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('universities', 'notes')
    op.drop_column('universities', 'semester_fee_eur')
    op.drop_column('universities', 'dormitory_cost_eur')
    op.drop_column('universities', 'study_language')
