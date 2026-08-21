"""slot 2: agent tool registry (#52)

Reserved migration slot. Owned exclusively by group agent-backend, issue #52.

This file is a placeholder committed ahead of parallel session work so that
concurrent groups never race to append to the migration chain. The whole chain
is fixed up front; each group fills in only the slot it owns.

Do not change `revision` or `down_revision` — the chain is the contract.
An unfilled slot is a valid no-op.

Revision ID: f20b2c3d4e5f
Revises: f10a1b2c3d4e
Create Date: 2026-08-21 00:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "f20b2c3d4e5f"
down_revision = "f10a1b2c3d4e"
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
