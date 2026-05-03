"""add expiry_date to inventory_item

Revision ID: a8b9c0d1e2f3
Revises: f1a2b3c4d5e6
Create Date: 2026-05-02 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = 'a8b9c0d1e2f3'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'inventory_item',
        sa.Column('expiry_date', sa.Date(), nullable=True),
    )


def downgrade():
    op.drop_column('inventory_item', 'expiry_date')
