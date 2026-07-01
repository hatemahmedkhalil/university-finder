"""add application_documents

Revision ID: o6j8k0l2m4n6
Revises: n5i7j9k1l3m5
Create Date: 2026-06-23 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'o6j8k0l2m4n6'
down_revision = 'n5i7j9k1l3m5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'application_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('application_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_name', sa.String(255), nullable=False),
        sa.Column('file_type', sa.String(100), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_application_documents_id', 'application_documents', ['id'])
    op.create_index('ix_application_documents_application_id', 'application_documents', ['application_id'])


def downgrade() -> None:
    op.drop_index('ix_application_documents_application_id', 'application_documents')
    op.drop_index('ix_application_documents_id', 'application_documents')
    op.drop_table('application_documents')
