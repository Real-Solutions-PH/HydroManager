"""add refresh_token table

Revision ID: f7a3c9e1b5d2
Revises: d4e6f8a0b2c1
Create Date: 2026-07-06 06:20:00.000000

"""

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision = "f7a3c9e1b5d2"
down_revision = "d4e6f8a0b2c1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "refreshtoken",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "token_hash",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_refreshtoken_user_id"), "refreshtoken", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_refreshtoken_token_hash"),
        "refreshtoken",
        ["token_hash"],
        unique=True,
    )


def downgrade():
    op.drop_index(op.f("ix_refreshtoken_token_hash"), table_name="refreshtoken")
    op.drop_index(op.f("ix_refreshtoken_user_id"), table_name="refreshtoken")
    op.drop_table("refreshtoken")
