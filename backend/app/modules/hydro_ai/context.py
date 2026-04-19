"""Build grounded context for the HydroManager AI assistant."""

import uuid

from sqlmodel import Session, col, select

from app.modules.batches.models import Batch, BatchStateCount, BatchTransition
from app.modules.crops.models import CropGuide
from app.modules.inventory.models import InventoryItem
from app.modules.setups.models import Setup


def build_context(
    *, session: Session, user_id: uuid.UUID, query: str
) -> tuple[str, list[dict]]:
    citations: list[dict] = []
    parts: list[str] = []

    setups = list(
        session.exec(
            select(Setup).where(
                Setup.owner_id == user_id,
                Setup.archived_at.is_(None),  # type: ignore
            )
        ).all()
    )
    if setups:
        parts.append("## Your active setups")
        for s in setups:
            parts.append(
                f"- {s.name} ({s.type.value}, {s.slot_count} slots, "
                f"{s.location_label or 'no location'})"
            )
            citations.append(
                {"type": "setup", "id": str(s.id), "label": s.name}
            )

    batches = list(
        session.exec(
            select(Batch).where(
                Batch.owner_id == user_id,
                Batch.archived_at.is_(None),  # type: ignore
            )
        ).all()
    )
    if batches:
        parts.append("\n## Active batches (milestone distribution)")
        for b in batches:
            counts = list(
                session.exec(
                    select(BatchStateCount).where(
                        BatchStateCount.batch_id == b.id
                    )
                ).all()
            )
            dist = ", ".join(
                f"{c.milestone_code.value}: {c.count}"
                for c in counts
                if c.count > 0
            ) or "no active units"
            parts.append(
                f"- {b.variety_name} (started {b.started_at.date()}, "
                f"init {b.initial_count}): {dist}"
            )
            citations.append(
                {"type": "batch", "id": str(b.id), "label": b.variety_name}
            )

            recent = list(
                session.exec(
                    select(BatchTransition)
                    .where(BatchTransition.batch_id == b.id)
                    .order_by(col(BatchTransition.occurred_at).desc())
                    .limit(5)
                ).all()
            )
            for t in recent:
                note = f" — {t.notes}" if t.notes else ""
                parts.append(
                    f"    · {t.occurred_at.date()}: "
                    f"{t.from_milestone.value}→{t.to_milestone.value} "
                    f"count={t.count}{note}"
                )

    inv = list(
        session.exec(
            select(InventoryItem).where(InventoryItem.owner_id == user_id)
        ).all()
    )
    if inv:
        parts.append("\n## Inventory (current stock)")
        for it in inv:
            flag = " [LOW]" if it.current_stock <= it.low_stock_threshold else ""
            parts.append(
                f"- {it.name} ({it.category.value}): "
                f"{it.current_stock} {it.unit.value}{flag}"
            )
            citations.append(
                {"type": "inventory_item", "id": str(it.id), "label": it.name}
            )

    q_lower = query.lower()
    crop_matches = list(
        session.exec(
            select(CropGuide)
            .where(
                (col(CropGuide.name_en).ilike(f"%{q_lower}%"))
                | (col(CropGuide.name_tl).ilike(f"%{q_lower}%"))
            )
            .limit(3)
        ).all()
    )
    if crop_matches:
        parts.append("\n## Relevant crop guide entries")
        for g in crop_matches:
            parts.append(
                f"- {g.name_en} ({g.name_tl}): "
                f"pH {g.ph_min}-{g.ph_max}, EC {g.ec_min}-{g.ec_max}, "
                f"harvest {g.days_to_harvest_min}-{g.days_to_harvest_max}d. "
                f"Issues: {g.common_issues or 'n/a'}"
            )
            citations.append(
                {"type": "crop_guide", "id": str(g.id), "label": g.name_en}
            )

    return "\n".join(parts), citations
