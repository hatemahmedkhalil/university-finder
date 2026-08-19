"""add amount_usd_cents and fx_rate to payments

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Down_revision: b3c4d5e6f7a8
Branch_labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'c4d5e6f7a8b9'
down_revision = 'b3c4d5e6f7a8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('payments',
        sa.Column('amount_usd_cents', sa.Integer(), nullable=True))
    op.add_column('payments',
        sa.Column('fx_rate', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('payments', 'fx_rate')
    op.drop_column('payments', 'amount_usd_cents')
