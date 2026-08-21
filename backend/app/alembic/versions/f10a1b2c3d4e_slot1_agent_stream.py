"""slot 1: agent stream tables (#51)

Reserved migration slot. Owned exclusively by group agent-backend, issue #51.

This file is a placeholder committed ahead of parallel session work so that
concurrent groups never race to append to the migration chain. The whole chain
is fixed up front; each group fills in only the slot it owns.

Do not change `revision` or `down_revision` — the chain is the contract.
An unfilled slot is a valid no-op.

Revision ID: f10a1b2c3d4e
Revises: d4e6f8a0b2c1
Create Date: 2026-08-21 00:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "f10a1b2c3d4e"
down_revision = "d4e6f8a0b2c1"
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
