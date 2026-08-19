"""add city_cost_of_living table

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-07-18
"""
from alembic import op
import sqlalchemy as sa

revision = "e4f5a6b7c8d9"
down_revision = ("e1f2a3b4c5d6", "d3e4f5a6b7c8")
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "city_cost_of_living",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("country", sa.String(50), nullable=False),
        sa.Column("rent_single_eur", sa.Integer(), nullable=True),   # 1-room apt or student room
        sa.Column("rent_shared_eur", sa.Integer(), nullable=True),   # shared/dormitory per month
        sa.Column("food_eur", sa.Integer(), nullable=True),          # groceries + eating out/month
        sa.Column("transport_eur", sa.Integer(), nullable=True),     # monthly public transport pass
        sa.Column("utilities_eur", sa.Integer(), nullable=True),     # electricity/water/internet/month
        sa.Column("total_min_eur", sa.Integer(), nullable=True),     # min monthly total
        sa.Column("total_max_eur", sa.Integer(), nullable=True),     # max monthly total
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_city_cost_city_country", "city_cost_of_living", ["city", "country"])


def downgrade():
    op.drop_index("ix_city_cost_city_country", "city_cost_of_living")
    op.drop_table("city_cost_of_living")
