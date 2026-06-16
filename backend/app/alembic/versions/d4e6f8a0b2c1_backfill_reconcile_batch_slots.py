"""backfill: free dead-unit slots on existing batches

Shrinks each non-archived batch's slot footprint to ceil(living / seeds_per_slot)
and archives any with no living units left — releasing slots that failed or
harvested units were still holding.

Revision ID: d4e6f8a0b2c1
Revises: c8a2b4d6e9f1
Create Date: 2026-06-16 00:00:00.000000

"""

from alembic import op
from sqlmodel import Session

# revision identifiers, used by Alembic.
revision = "d4e6f8a0b2c1"
down_revision = "c8a2b4d6e9f1"
branch_labels = None
depends_on = None


def upgrade():
    from app.modules.batches import services as batch_services

    session = Session(bind=op.get_bind())
    batch_services.reconcile_active_batch_slots(session=session, commit=False)
    session.flush()


def downgrade():
    # Data backfill — not reversible.
    pass
