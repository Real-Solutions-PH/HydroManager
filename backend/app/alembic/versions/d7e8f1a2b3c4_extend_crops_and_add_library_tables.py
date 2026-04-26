"""Extend crop_guide and add library_guide / library_pest tables

Revision ID: d7e8f1a2b3c4
Revises: c6a1b2d3e4f5
Create Date: 2026-04-25 00:00:00.000000

"""
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd7e8f1a2b3c4'
down_revision = 'c6a1b2d3e4f5'
branch_labels = None
depends_on = None


def upgrade():
    # --- Extend crop_guide ---
    op.add_column('crop_guide', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True))
    op.add_column('crop_guide', sa.Column('ec_seedling', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('ec_vegetative', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('ec_mature', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('ec_fruiting', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('water_temp_c', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True))
    op.add_column('crop_guide', sa.Column('humidity_pct', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True))
    op.add_column('crop_guide', sa.Column('growlight_hours', sqlmodel.sql.sqltypes.AutoString(length=40), nullable=True))
    op.add_column('crop_guide', sa.Column('local_price_php_per_kg_min', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('local_price_php_per_kg_max', sa.Float(), nullable=True))
    op.add_column('crop_guide', sa.Column('tips', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('crop_guide', sa.Column('risks', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('crop_guide', sa.Column('growth_stages', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # --- library_guide ---
    op.create_table(
        'library_guide',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=160), nullable=False),
        sa.Column('summary', sqlmodel.sql.sqltypes.AutoString(length=400), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('body_md', sa.Text(), nullable=False),
        sa.Column('image_key', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
        sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('read_time_min', sa.Integer(), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('source', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_library_guide_category', 'library_guide', ['category'])

    # --- library_pest ---
    op.create_table(
        'library_pest',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=120), nullable=False),
        sa.Column('kind', sa.String(length=20), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('affected_crops', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('symptoms', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('causes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('prevention', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('treatment', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('image_key', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
        sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('source', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_library_pest_kind', 'library_pest', ['kind'])


def downgrade():
    op.drop_index('ix_library_pest_kind', table_name='library_pest')
    op.drop_table('library_pest')
    op.drop_index('ix_library_guide_category', table_name='library_guide')
    op.drop_table('library_guide')

    op.drop_column('crop_guide', 'growth_stages')
    op.drop_column('crop_guide', 'risks')
    op.drop_column('crop_guide', 'tips')
    op.drop_column('crop_guide', 'local_price_php_per_kg_max')
    op.drop_column('crop_guide', 'local_price_php_per_kg_min')
    op.drop_column('crop_guide', 'growlight_hours')
    op.drop_column('crop_guide', 'humidity_pct')
    op.drop_column('crop_guide', 'water_temp_c')
    op.drop_column('crop_guide', 'ec_fruiting')
    op.drop_column('crop_guide', 'ec_mature')
    op.drop_column('crop_guide', 'ec_vegetative')
    op.drop_column('crop_guide', 'ec_seedling')
    op.drop_column('crop_guide', 'image_url')
