"""add applications

Revision ID: c4d6e8f0a1b3
Revises: b3c5d7e9f0a2
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'c4d6e8f0a1b3'
down_revision = 'b3c5d7e9f0a2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'applications',
        sa.Column('id',            sa.Integer(),     primary_key=True, index=True),
        sa.Column('user_id',       sa.Integer(),     sa.ForeignKey('users.id',        ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('university_id', sa.Integer(),     sa.ForeignKey('universities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status',        sa.String(20),    nullable=False, server_default='interested'),
        sa.Column('notes',         sa.Text(),        nullable=True),
        sa.Column('created_at',    sa.DateTime(),    nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',    sa.DateTime(),    nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('user_id', 'university_id', name='uq_user_university'),
    )


def downgrade():
    op.drop_table('applications')
