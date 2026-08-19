"""add community tables

Revision ID: f1a2b3c4d5e6
Revises: e4f5a6b7c8d9
Create Date: 2026-07-18
"""
from alembic import op
import sqlalchemy as sa

revision = "f1a2b3c4d5e6"
down_revision = "e4f5a6b7c8d9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "community_posts",
        sa.Column("id",          sa.Integer,     primary_key=True, index=True),
        sa.Column("user_id",     sa.Integer,     sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title",       sa.String(200), nullable=False),
        sa.Column("body",        sa.Text,        nullable=False),
        sa.Column("category",    sa.String(50),  nullable=False, server_default="general"),
        sa.Column("country_tag", sa.String(50),  nullable=True),
        sa.Column("created_at",  sa.DateTime,    server_default=sa.func.now()),
        sa.Column("updated_at",  sa.DateTime,    server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_table(
        "community_comments",
        sa.Column("id",         sa.Integer, primary_key=True, index=True),
        sa.Column("post_id",    sa.Integer, sa.ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id",    sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body",       sa.Text,    nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "community_likes",
        sa.Column("id",      sa.Integer, primary_key=True),
        sa.Column("post_id", sa.Integer, sa.ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("post_id", "user_id", name="uq_community_likes"),
    )


def downgrade():
    op.drop_table("community_likes")
    op.drop_table("community_comments")
    op.drop_table("community_posts")
