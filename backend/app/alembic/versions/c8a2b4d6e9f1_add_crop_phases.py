"""Add per-crop phases override to crop_guide

Revision ID: c8a2b4d6e9f1
Revises: c7f1a9d3b2e5
Create Date: 2026-06-16 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c8a2b4d6e9f1'
down_revision = 'c7f1a9d3b2e5'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'crop_guide',
        sa.Column('phases', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade():
    op.drop_column('crop_guide', 'phases')
