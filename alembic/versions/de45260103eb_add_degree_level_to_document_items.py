"""add_degree_level_to_document_items

Revision ID: de45260103eb
Revises: b2c3d4e5f6a7
Create Date: 2026-07-11 07:26:13.117048

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'de45260103eb'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('university_document_items',
        sa.Column('degree_level', sa.String(20), nullable=False, server_default='all')
    )


def downgrade() -> None:
    op.drop_column('university_document_items', 'degree_level')
