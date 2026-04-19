"""Hydro V1 remainder: user tier/locale, sales, ai_quota_usage

Revision ID: c6a1b2d3e4f5
Revises: b5f0a1c2d3e4
Create Date: 2026-04-19 00:30:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c6a1b2d3e4f5'
down_revision = 'b5f0a1c2d3e4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'user',
        sa.Column('tier', sa.String(length=20), nullable=False, server_default='free'),
    )
    op.add_column(
        'user',
        sa.Column('locale', sa.String(length=8), nullable=False, server_default='en'),
    )

    op.create_table(
        'ai_quota_usage',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('messages_used', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_quota_usage_user_id', 'ai_quota_usage', ['user_id'])

    op.create_table(
        'sale',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('buyer_label', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=True),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('sold_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('payment_status', sa.String(length=20), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sale_owner_id', 'sale', ['owner_id'])

    op.create_table(
        'sale_item',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('sale_id', sa.Uuid(), nullable=False),
        sa.Column('crop_name', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('linked_batch_id', sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(['sale_id'], ['sale.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['linked_batch_id'], ['batch.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sale_item_sale_id', 'sale_item', ['sale_id'])

    op.create_table(
        'overhead_cost',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('category', sqlmodel.sql.sqltypes.AutoString(length=80), nullable=False),
        sa.Column('monthly_cost', sa.Float(), nullable=False),
        sa.Column('effective_from', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_overhead_cost_owner_id', 'overhead_cost', ['owner_id'])


def downgrade():
    op.drop_index('ix_overhead_cost_owner_id', table_name='overhead_cost')
    op.drop_table('overhead_cost')
    op.drop_index('ix_sale_item_sale_id', table_name='sale_item')
    op.drop_table('sale_item')
    op.drop_index('ix_sale_owner_id', table_name='sale')
    op.drop_table('sale')
    op.drop_index('ix_ai_quota_usage_user_id', table_name='ai_quota_usage')
    op.drop_table('ai_quota_usage')
    op.drop_column('user', 'locale')
    op.drop_column('user', 'tier')
