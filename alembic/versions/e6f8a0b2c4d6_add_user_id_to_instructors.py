"""add user_id to instructors

Revision ID: e6f8a0b2c4d6
Revises: d5e7f9a1b3c5
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'e6f8a0b2c4d6'
down_revision = 'd5e7f9a1b3c5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('instructors',
        sa.Column('user_id', sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='SET NULL'),
                  nullable=True, unique=True))
    op.create_index('ix_instructors_user_id', 'instructors', ['user_id'])


def downgrade():
    op.drop_index('ix_instructors_user_id', table_name='instructors')
    op.drop_column('instructors', 'user_id')
