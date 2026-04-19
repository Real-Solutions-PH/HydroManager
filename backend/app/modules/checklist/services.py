"""Rule-based daily checklist engine. Not LLM-driven."""

import uuid
from datetime import datetime, timezone

from sqlmodel import Session, col, select

from app.modules.batches.models import Batch, BatchStateCount
from app.modules.batches.schema import Milestone
from app.modules.crops.models import CropGuide
from app.modules.iam.users.models import User
from app.modules.inventory.models import InventoryItem
from app.modules.setups.models import Setup
from app.modules.setups.schema import SetupType


def _age_days(started_at: datetime) -> int:
    return max(
        int(
            (datetime.now(timezone.utc) - started_at).total_seconds() // 86400
        ),
        0,
    )


PH_CADENCE_DAYS = {
    SetupType.DFT: 2,
    SetupType.NFT: 2,
    SetupType.DutchBucket: 3,
    SetupType.Kratky: 7,
    SetupType.SNAP: 3,
}

WATER_CHANGE_DAYS = {
    SetupType.DFT: 14,
    SetupType.NFT: 14,
    SetupType.DutchBucket: 21,
    SetupType.Kratky: 30,
    SetupType.SNAP: 21,
}


def generate_tasks(
    *, session: Session, current_user: User
) -> list[dict]:
    owner = current_user.id
    setups = list(
        session.exec(
            select(Setup).where(
                Setup.owner_id == owner,
                Setup.archived_at.is_(None),  # type: ignore
            )
        ).all()
    )
    setups_by_id = {s.id: s for s in setups}

    batches = list(
        session.exec(
            select(Batch).where(
                Batch.owner_id == owner,
                Batch.archived_at.is_(None),  # type: ignore
            )
        ).all()
    )

    guides: dict[uuid.UUID, CropGuide] = {}
    guide_ids = [b.crop_guide_id for b in batches if b.crop_guide_id]
    if guide_ids:
        for g in session.exec(
            select(CropGuide).where(col(CropGuide.id).in_(guide_ids))
        ).all():
            guides[g.id] = g

    tasks: list[dict] = []
    for b in batches:
        setup = setups_by_id.get(b.setup_id)
        if setup is None:
            continue
        age = _age_days(b.started_at)
        guide = guides.get(b.crop_guide_id) if b.crop_guide_id else None

        sowed = _count_at(session, b.id, Milestone.Sowed)
        if sowed > 0 and age >= 3:
            tasks.append(
                {
                    "id": f"{b.id}-germ",
                    "source": "milestone",
                    "urgency": "today" if age <= 5 else "overdue",
                    "title": f"Check germination: {b.variety_name}",
                    "detail": f"Day {age}. {sowed} still in Sowed. Log how many germinated.",
                    "batch_id": str(b.id),
                    "setup_id": str(setup.id),
                    "section": "Daily",
                }
            )

        cadence = PH_CADENCE_DAYS.get(setup.type, 2)
        if age > 0 and age % cadence == 0:
            tasks.append(
                {
                    "id": f"{b.id}-ph",
                    "source": "monitoring",
                    "urgency": "today",
                    "title": f"Log pH/EC: {setup.name}",
                    "detail": f"{setup.type.value} cadence: every {cadence} days.",
                    "batch_id": str(b.id),
                    "setup_id": str(setup.id),
                    "section": "Every 2-3 Days",
                }
            )

        wc = WATER_CHANGE_DAYS.get(setup.type, 14)
        if age > 0 and age % wc == 0:
            tasks.append(
                {
                    "id": f"{b.id}-wc",
                    "source": "maintenance",
                    "urgency": "today",
                    "title": f"Water change: {setup.name}",
                    "detail": f"{setup.type.value} schedule: every {wc} days.",
                    "batch_id": str(b.id),
                    "setup_id": str(setup.id),
                    "section": "Biweekly",
                }
            )

        if guide and age >= guide.days_to_harvest_min:
            ready = _count_at(session, b.id, Milestone.HarvestReady)
            if ready == 0:
                tasks.append(
                    {
                        "id": f"{b.id}-harvest-ready",
                        "source": "milestone",
                        "urgency": "soon",
                        "title": f"Harvest window: {b.variety_name}",
                        "detail": (
                            f"Day {age} — guide says "
                            f"{guide.days_to_harvest_min}-{guide.days_to_harvest_max}. "
                            f"Inspect for harvest signs."
                        ),
                        "batch_id": str(b.id),
                        "setup_id": str(setup.id),
                        "section": "Daily",
                    }
                )

        ready = _count_at(session, b.id, Milestone.HarvestReady)
        if ready > 0:
            tasks.append(
                {
                    "id": f"{b.id}-harvest",
                    "source": "milestone",
                    "urgency": "today",
                    "title": f"Harvest {ready} of {b.variety_name}",
                    "detail": "Harvest-ready units detected. Log weight + count.",
                    "batch_id": str(b.id),
                    "setup_id": str(setup.id),
                    "section": "Daily",
                }
            )

    low = list(
        session.exec(
            select(InventoryItem).where(InventoryItem.owner_id == owner)
        ).all()
    )
    for it in low:
        if it.current_stock <= it.low_stock_threshold:
            tasks.append(
                {
                    "id": f"inv-{it.id}",
                    "source": "inventory",
                    "urgency": "soon",
                    "title": f"Restock: {it.name}",
                    "detail": (
                        f"{it.current_stock} {it.unit.value} left "
                        f"(min {it.low_stock_threshold})."
                    ),
                    "item_id": str(it.id),
                    "section": "Daily",
                }
            )

    urgency_order = {"overdue": 0, "today": 1, "soon": 2}
    tasks.sort(key=lambda t: urgency_order.get(t["urgency"], 9))
    return tasks


def _count_at(session: Session, batch_id: uuid.UUID, ms: Milestone) -> int:
    q = select(BatchStateCount).where(
        BatchStateCount.batch_id == batch_id,
        BatchStateCount.milestone_code == ms,
    )
    row = session.exec(q).one_or_none()
    return int(row.count) if row else 0
