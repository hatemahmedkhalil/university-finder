"""add subscription plans

Revision ID: h9c1d3e5f7a9
Revises: g8b0c2d4e6f8
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'h9c1d3e5f7a9'
down_revision = 'g8b0c2d4e6f8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'subscription_plans',
        sa.Column('id',          sa.Integer(),     primary_key=True, index=True),
        sa.Column('name',        sa.String(100),   nullable=False, unique=True),
        sa.Column('price',       sa.Float(),       nullable=True),
        sa.Column('description', sa.String(500),   nullable=True),
        sa.Column('features',    sa.Text(),        nullable=True),
        sa.Column('is_active',   sa.Boolean(),     nullable=False, server_default=sa.true()),
        sa.Column('is_featured', sa.Boolean(),     nullable=False, server_default=sa.false()),
        sa.Column('created_at',  sa.DateTime(),    nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',  sa.DateTime(),    nullable=False, server_default=sa.func.now()),
    )

    # Seed the Free plan
    op.execute("""
        INSERT INTO subscription_plans (name, price, description, features, is_active, is_featured, created_at, updated_at)
        VALUES (
            'Free',
            0,
            'Get started with basic university recommendations.',
            '["Up to 3 university recommendations","Basic matching system","No detailed university information","No premium support"]',
            true,
            true,
            NOW(),
            NOW()
        )
    """)

    # Premium placeholder
    op.execute("""
        INSERT INTO subscription_plans (name, price, description, features, is_active, is_featured, created_at, updated_at)
        VALUES (
            'Premium',
            NULL,
            'Coming Soon',
            '["Features will be announced soon."]',
            true,
            false,
            NOW(),
            NOW()
        )
    """)

    # Pro placeholder
    op.execute("""
        INSERT INTO subscription_plans (name, price, description, features, is_active, is_featured, created_at, updated_at)
        VALUES (
            'Pro',
            NULL,
            'Coming Soon',
            '["Features will be announced soon."]',
            true,
            false,
            NOW(),
            NOW()
        )
    """)


def downgrade():
    op.drop_table('subscription_plans')
