"""add session_id to ai_chat_messages

Revision ID: a9b8c7d6e5f4
Revises: f1a2b3c4d5e6
Down_revision: f1a2b3c4d5e6
Branch_labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'a9b8c7d6e5f4'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('ai_chat_messages',
        sa.Column('session_id', sa.String(36), nullable=True)
    )
    op.create_index('ix_ai_chat_messages_session_id', 'ai_chat_messages', ['session_id'])
    # Backfill: group existing messages into sessions per user per day
    op.execute("""
        UPDATE ai_chat_messages
        SET session_id = user_id::text || '-' || DATE(created_at)::text
    """)


def downgrade():
    op.drop_index('ix_ai_chat_messages_session_id', 'ai_chat_messages')
    op.drop_column('ai_chat_messages', 'session_id')
