"""add_user_languages

Revision ID: n5i7j9k1l3m5
Revises: 3568a353666d
Create Date: 2026-06-21 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'n5i7j9k1l3m5'
down_revision: Union[str, None] = '3568a353666d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_languages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(50), nullable=False),
        sa.Column('level', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_languages_id', 'user_languages', ['id'])
    op.create_index('ix_user_languages_user_id', 'user_languages', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_user_languages_user_id', 'user_languages')
    op.drop_index('ix_user_languages_id', 'user_languages')
    op.drop_table('user_languages')
