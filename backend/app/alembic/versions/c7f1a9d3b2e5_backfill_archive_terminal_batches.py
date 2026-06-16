"""backfill: archive pre-existing fully failed/harvested batches

Archives every non-archived batch that already has no living units left
(all Failed/Harvested) and frees its setup slots, matching the auto-archive
behavior introduced for new transitions/harvests.

Revision ID: c7f1a9d3b2e5
Revises: 4a1ba7088c55
Create Date: 2026-06-16 00:00:00.000000

"""

from alembic import op
from sqlmodel import Session

# revision identifiers, used by Alembic.
revision = "c7f1a9d3b2e5"
down_revision = "4a1ba7088c55"
branch_labels = None
depends_on = None


def upgrade():
    from app.modules.batches import services as batch_services

    session = Session(bind=op.get_bind())
    batch_services.archive_terminal_batches(session=session, commit=False)
    session.flush()


def downgrade():
    # Data backfill — not reversible (cannot tell which batches were archived
    # by this migration versus already archived beforehand).
    pass
