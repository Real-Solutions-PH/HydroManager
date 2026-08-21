"""slot 4: push subscriptions (#63)

Reserved migration slot. Owned exclusively by group web-push, issue #63.

This file is a placeholder committed ahead of parallel session work so that
concurrent groups never race to append to the migration chain. The whole chain
is fixed up front; each group fills in only the slot it owns.

Do not change `revision` or `down_revision` — the chain is the contract.
An unfilled slot is a valid no-op.

Revision ID: f40d4e5f6a1b
Revises: f30c3d4e5f6a
Create Date: 2026-08-21 00:00:00.000000

"""

# revision identifiers, used by Alembic.
revision = "f40d4e5f6a1b"
down_revision = "f30c3d4e5f6a"
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
