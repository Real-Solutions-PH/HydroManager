"""slot 3: change feed and tombstones (#57)

Reserved migration slot. Owned exclusively by group change-feed, issue #57.

This file is a placeholder committed ahead of parallel session work so that
concurrent groups never race to append to the migration chain. The whole chain
is fixed up front; each group fills in only the slot it owns.

Do not change `revision` or `down_revision` — the chain is the contract.
An unfilled slot is a valid no-op.

Revision ID: f30c3d4e5f6a
Revises: f20b2c3d4e5f
Create Date: 2026-08-21 00:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "f30c3d4e5f6a"
down_revision = "f20b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
