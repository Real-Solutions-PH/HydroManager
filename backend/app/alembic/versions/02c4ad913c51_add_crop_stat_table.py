"""add crop_stat table

Revision ID: 02c4ad913c51
Revises: d7e3f4a5b6c7
Create Date: 2026-04-26 08:31:26.514916

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = '02c4ad913c51'
down_revision = 'd7e3f4a5b6c7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'crop_stat',
        sa.Column('field', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=False),
        sa.Column('min_value', sa.Float(), nullable=False),
        sa.Column('max_value', sa.Float(), nullable=False),
        sa.Column('avg_value', sa.Float(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('field'),
    )


def downgrade():
    op.drop_table('crop_stat')
