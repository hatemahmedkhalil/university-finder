"""add_plan_to_users_and_ai_chat_messages

Revision ID: 418de79d3f37
Revises: m4h6i8j0k2l4
Create Date: 2026-06-21 10:23:17.860810

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '418de79d3f37'
down_revision: Union[str, None] = 'm4h6i8j0k2l4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan', sa.String(length=20), nullable=False, server_default='free'))

    op.create_table(
        'ai_chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_chat_messages_id', 'ai_chat_messages', ['id'], unique=False)
    op.create_index('ix_ai_chat_messages_user_id', 'ai_chat_messages', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_ai_chat_messages_user_id', table_name='ai_chat_messages')
    op.drop_index('ix_ai_chat_messages_id', table_name='ai_chat_messages')
    op.drop_table('ai_chat_messages')
    op.drop_column('users', 'plan')
