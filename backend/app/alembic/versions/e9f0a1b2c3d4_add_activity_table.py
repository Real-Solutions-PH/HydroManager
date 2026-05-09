"""Add activity table for recent activity feed

Revision ID: e9f0a1b2c3d4
Revises: a8b9c0d1e2f3
Create Date: 2026-05-08 00:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e9f0a1b2c3d4'
down_revision = 'a8b9c0d1e2f3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'activity',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('action_type', sa.String(length=40), nullable=False),
        sa.Column('target_type', sa.String(length=32), nullable=True),
        sa.Column('target_id', sa.Uuid(), nullable=True),
        sa.Column(
            'summary',
            sqlmodel.sql.sqltypes.AutoString(length=240),
            nullable=False,
        ),
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_activity_user_id', 'activity', ['user_id'])
    op.create_index('ix_activity_action_type', 'activity', ['action_type'])
    op.create_index('ix_activity_created_at', 'activity', ['created_at'])


def downgrade():
    op.drop_index('ix_activity_created_at', table_name='activity')
    op.drop_index('ix_activity_action_type', table_name='activity')
    op.drop_index('ix_activity_user_id', table_name='activity')
    op.drop_table('activity')
