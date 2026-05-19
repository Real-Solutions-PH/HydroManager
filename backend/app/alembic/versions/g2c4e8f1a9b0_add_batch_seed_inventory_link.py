"""add batch.seed_inventory_item_id

Revision ID: g2c4e8f1a9b0
Revises: e9f0a1b2c3d4
Create Date: 2026-05-18 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = 'g2c4e8f1a9b0'
down_revision = 'e9f0a1b2c3d4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'batch',
        sa.Column('seed_inventory_item_id', sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        'fk_batch_seed_inventory_item_id',
        'batch',
        'inventory_item',
        ['seed_inventory_item_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint(
        'fk_batch_seed_inventory_item_id', 'batch', type_='foreignkey'
    )
    op.drop_column('batch', 'seed_inventory_item_id')
