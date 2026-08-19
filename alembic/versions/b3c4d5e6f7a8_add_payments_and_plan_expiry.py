"""add payments table, subscription_plans.duration_days, users.plan_expires_at

Revision ID: b3c4d5e6f7a8
Revises: a9b8c7d6e5f4
Down_revision: a9b8c7d6e5f4
Branch_labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'b3c4d5e6f7a8'
down_revision = 'a9b8c7d6e5f4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('subscription_plans',
        sa.Column('duration_days', sa.Integer(), nullable=True))

    op.add_column('users',
        sa.Column('plan_expires_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('plan_id', sa.Integer(), sa.ForeignKey('subscription_plans.id'), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='EGP'),
        sa.Column('paymob_order_id', sa.String(100), nullable=True, unique=True, index=True),
        sa.Column('paymob_transaction_id', sa.String(100), nullable=True, index=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('pending', 'paid', 'failed')", name='ck_payment_status'),
    )


def downgrade():
    op.drop_table('payments')
    op.drop_column('users', 'plan_expires_at')
    op.drop_column('subscription_plans', 'duration_days')
