"""Add hydro modules: setups, batches, inventory, crop_guide

Revision ID: b5f0a1c2d3e4
Revises: a7c3f1e92b10
Create Date: 2026-04-19 00:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = 'b5f0a1c2d3e4'
down_revision = 'a7c3f1e92b10'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'setup',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('slot_count', sa.Integer(), nullable=False),
        sa.Column('location_label', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=True),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('installed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_setup_owner_id', 'setup', ['owner_id'])

    op.create_table(
        'setup_slot',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('setup_id', sa.Uuid(), nullable=False),
        sa.Column('slot_code', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=False),
        sa.Column('position_index', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['setup_id'], ['setup.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_setup_slot_setup_id', 'setup_slot', ['setup_id'])

    op.create_table(
        'setup_photo',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('setup_id', sa.Uuid(), nullable=False),
        sa.Column('storage_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['setup_id'], ['setup.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_setup_photo_setup_id', 'setup_photo', ['setup_id'])

    op.create_table(
        'batch',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('setup_id', sa.Uuid(), nullable=False),
        sa.Column('crop_guide_id', sa.Uuid(), nullable=True),
        sa.Column('variety_name', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column('initial_count', sa.Integer(), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['setup_id'], ['setup.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_batch_owner_id', 'batch', ['owner_id'])
    op.create_index('ix_batch_setup_id', 'batch', ['setup_id'])

    op.create_table(
        'batch_state_count',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('batch_id', sa.Uuid(), nullable=False),
        sa.Column('milestone_code', sa.String(length=20), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batch.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_batch_state_count_batch_id', 'batch_state_count', ['batch_id'])

    op.create_table(
        'batch_transition',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('batch_id', sa.Uuid(), nullable=False),
        sa.Column('from_milestone', sa.String(length=20), nullable=False),
        sa.Column('to_milestone', sa.String(length=20), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('photo_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batch.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_batch_transition_batch_id', 'batch_transition', ['batch_id'])

    op.create_table(
        'batch_harvest',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('batch_id', sa.Uuid(), nullable=False),
        sa.Column('weight_grams', sa.Float(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('harvested_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['batch.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_batch_harvest_batch_id', 'batch_harvest', ['batch_id'])

    op.create_table(
        'inventory_item',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('current_stock', sa.Float(), nullable=False),
        sa.Column('low_stock_threshold', sa.Float(), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_inventory_item_owner_id', 'inventory_item', ['owner_id'])

    op.create_table(
        'inventory_movement',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('item_id', sa.Uuid(), nullable=False),
        sa.Column('movement_type', sa.String(length=20), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('cost_total', sa.Float(), nullable=True),
        sa.Column('related_batch_id', sa.Uuid(), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_item.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['related_batch_id'], ['batch.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_inventory_movement_item_id', 'inventory_movement', ['item_id'])

    op.create_table(
        'crop_guide',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name_en', sqlmodel.sql.sqltypes.AutoString(length=80), nullable=False),
        sa.Column('name_tl', sqlmodel.sql.sqltypes.AutoString(length=80), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('recommended_setups', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('ph_min', sa.Float(), nullable=False),
        sa.Column('ph_max', sa.Float(), nullable=False),
        sa.Column('ec_min', sa.Float(), nullable=False),
        sa.Column('ec_max', sa.Float(), nullable=False),
        sa.Column('days_to_harvest_min', sa.Integer(), nullable=False),
        sa.Column('days_to_harvest_max', sa.Integer(), nullable=False),
        sa.Column('typical_yield_grams', sa.Float(), nullable=True),
        sa.Column('sunlight_hours', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True),
        sa.Column('temperature_day_c', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True),
        sa.Column('temperature_night_c', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True),
        sa.Column('common_issues', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('harvest_indicator', sqlmodel.sql.sqltypes.AutoString(length=300), nullable=True),
        sa.Column('image_key', sqlmodel.sql.sqltypes.AutoString(length=80), nullable=True),
        sa.Column('source', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('crop_guide')
    op.drop_index('ix_inventory_movement_item_id', table_name='inventory_movement')
    op.drop_table('inventory_movement')
    op.drop_index('ix_inventory_item_owner_id', table_name='inventory_item')
    op.drop_table('inventory_item')
    op.drop_index('ix_batch_harvest_batch_id', table_name='batch_harvest')
    op.drop_table('batch_harvest')
    op.drop_index('ix_batch_transition_batch_id', table_name='batch_transition')
    op.drop_table('batch_transition')
    op.drop_index('ix_batch_state_count_batch_id', table_name='batch_state_count')
    op.drop_table('batch_state_count')
    op.drop_index('ix_batch_setup_id', table_name='batch')
    op.drop_index('ix_batch_owner_id', table_name='batch')
    op.drop_table('batch')
    op.drop_index('ix_setup_photo_setup_id', table_name='setup_photo')
    op.drop_table('setup_photo')
    op.drop_index('ix_setup_slot_setup_id', table_name='setup_slot')
    op.drop_table('setup_slot')
    op.drop_index('ix_setup_owner_id', table_name='setup')
    op.drop_table('setup')
