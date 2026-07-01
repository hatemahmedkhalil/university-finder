"""add application hub tables

Revision ID: s1t2u3v4w5x6
Revises: r9m1n3o5p7q9
Create Date: 2026-06-30 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 's1t2u3v4w5x6'
down_revision = 'r9m1n3o5p7q9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'student_documents',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('doc_type', sa.String(50), nullable=False, server_default='other'),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_name', sa.String(200), nullable=False),
        sa.Column('file_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_table(
        'motivation_letters',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('university_id', sa.Integer(), sa.ForeignKey('universities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('university_name', sa.String(300), nullable=True),
        sa.Column('program', sa.String(200), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.add_column('universities', sa.Column('application_method', sa.String(30), nullable=True))
    op.add_column('universities', sa.Column('application_portal_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('universities', 'application_portal_url')
    op.drop_column('universities', 'application_method')
    op.drop_table('motivation_letters')
    op.drop_table('student_documents')
