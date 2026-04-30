"""Add unit_cost to inventory_item; create produce + produce_movement tables

Revision ID: d7e3f4a5b6c7
Revises: d7e8f1a2b3c4
Create Date: 2026-04-25 00:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = 'd7e3f4a5b6c7'
down_revision = 'd7e8f1a2b3c4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'inventory_item',
        sa.Column('unit_cost', sa.Float(), nullable=True),
    )

    op.create_table(
        'produce',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('source_batch_id', sa.Uuid(), nullable=True),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sqlmodel.sql.sqltypes.AutoString(length=24), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ready'),
        sa.Column('harvested_at', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('selling_price', sa.Float(), nullable=True),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_batch_id'], ['batch.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_produce_owner_id', 'produce', ['owner_id'])

    op.create_table(
        'produce_movement',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('produce_id', sa.Uuid(), nullable=False),
        sa.Column('movement_type', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('related_sale_id', sa.Uuid(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.ForeignKeyConstraint(['produce_id'], ['produce.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['related_sale_id'], ['sale.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_produce_movement_produce_id', 'produce_movement', ['produce_id'])


def downgrade():
    op.drop_index('ix_produce_movement_produce_id', table_name='produce_movement')
    op.drop_table('produce_movement')
    op.drop_index('ix_produce_owner_id', table_name='produce')
    op.drop_table('produce')
    op.drop_column('inventory_item', 'unit_cost')
