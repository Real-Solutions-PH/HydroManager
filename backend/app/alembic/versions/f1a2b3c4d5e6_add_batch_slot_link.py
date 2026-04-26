"""add batch_id to setup_slot; slots_used + seeds_per_slot to batch

Revision ID: f1a2b3c4d5e6
Revises: 02c4ad913c51
Create Date: 2026-04-26 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

revision = 'f1a2b3c4d5e6'
down_revision = '02c4ad913c51'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'setup_slot',
        sa.Column('batch_id', sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        'fk_setup_slot_batch_id',
        'setup_slot',
        'batch',
        ['batch_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.add_column(
        'batch',
        sa.Column('slots_used', sa.Integer(), nullable=True),
    )
    op.add_column(
        'batch',
        sa.Column('seeds_per_slot', sa.Integer(), nullable=True),
    )


def downgrade():
    op.drop_column('batch', 'seeds_per_slot')
    op.drop_column('batch', 'slots_used')
    op.drop_constraint('fk_setup_slot_batch_id', 'setup_slot', type_='foreignkey')
    op.drop_column('setup_slot', 'batch_id')
