"""add task table

Revision ID: 4a1ba7088c55
Revises: g2c4e8f1a9b0
Create Date: 2026-06-15 15:49:05.920557

"""

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "4a1ba7088c55"
down_revision = "g2c4e8f1a9b0"
branch_labels = None
depends_on = None


def upgrade():
    # priority / recur_freq stored as VARCHAR to match the project convention
    # for enum-typed columns (e.g. batch.milestone_code); the SQLModel layer
    # still exposes them as Python enums.
    op.create_table(
        "task",
        sa.Column(
            "title",
            sqlmodel.sql.sqltypes.AutoString(length=200),
            nullable=False,
        ),
        sa.Column(
            "body",
            sqlmodel.sql.sqltypes.AutoString(length=2000),
            nullable=True,
        ),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("recur_freq", sa.String(length=20), nullable=False),
        sa.Column("recur_interval", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("task")
