"""add instructor role

Revision ID: f7a9b1c3d5e7
Revises: e6f8a0b2c4d6
Create Date: 2026-06-20
"""
from alembic import op

revision = 'f7a9b1c3d5e7'
down_revision = 'e6f8a0b2c4d6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_user_role")
    op.execute("ALTER TABLE users ADD CONSTRAINT ck_user_role CHECK (role IN ('student', 'admin', 'instructor'))")


def downgrade():
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_user_role")
    op.execute("ALTER TABLE users ADD CONSTRAINT ck_user_role CHECK (role IN ('student', 'admin'))")
