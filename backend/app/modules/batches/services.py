import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session, col, func, select

from app.modules.activity import services as activity_service
from app.modules.activity.schema import ActivityType, TargetType
from app.modules.batches import repo as batches_repo
from app.modules.batches.models import (
    Batch,
    BatchHarvest,
    BatchStateCount,
    BatchTransition,
)
from app.modules.batches.schema import (
    BatchCreate,
    BatchHarvestCreate,
    BatchTransitionCreate,
    BatchUpdate,
    Milestone,
)
from app.modules.hydro_common.quota import enforce_active_batch_limit
from app.modules.iam.users.models import User
from app.modules.inventory import repo as inv_repo
from app.modules.inventory.models import InventoryMovement
from app.modules.inventory.schema import InventoryCategory, MovementType
from app.modules.setups import repo as setups_repo
from app.modules.setups.models import SetupSlot
from app.modules.setups.schema import SlotStatus


def _authorize(batch: Batch, user: User) -> None:
    if not user.is_superuser and batch.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def list_batches(
    *,
    session: Session,
    current_user: User,
    setup_id: uuid.UUID | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Batch], int]:
    owner_id = None if current_user.is_superuser else current_user.id
    return batches_repo.get_multi(
        session=session,
        owner_id=owner_id,
        setup_id=setup_id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )


def get_batch(*, session: Session, current_user: User, batch_id: uuid.UUID) -> Batch:
    batch = batches_repo.get_by_id(session=session, batch_id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    _authorize(batch, current_user)
    return batch


def _get_empty_slots(
    *, session: Session, setup_id: uuid.UUID, count: int
) -> list[SetupSlot]:
    q = (
        select(SetupSlot)
        .where(
            SetupSlot.setup_id == setup_id,
            SetupSlot.status == SlotStatus.EMPTY,
            SetupSlot.batch_id.is_(None),  # type: ignore
        )
        .order_by(col(SetupSlot.position_index).asc())
        .limit(count)
    )
    return list(session.exec(q).all())


def _free_slots_for_batch(*, session: Session, batch_id: uuid.UUID) -> None:
    q = select(SetupSlot).where(SetupSlot.batch_id == batch_id)
    for slot in session.exec(q).all():
        slot.batch_id = None
        slot.status = SlotStatus.EMPTY
        session.add(slot)


_TERMINAL_MILESTONES = {Milestone.Failed, Milestone.Harvested}


def _maybe_auto_archive(*, session: Session, current_user: User, batch: Batch) -> bool:
    """Archive batch + free its slots once no living units remain.

    A batch is done when every unit has reached a terminal milestone
    (Failed or Harvested) — covers fully failed, fully harvested, and mixed.
    Idempotent (guards on archived_at) and one-way. Returns True if archived.
    """
    if batch.archived_at is not None:
        return False
    rows = batches_repo.list_state_counts(session=session, batch_id=batch.id)
    total = sum(r.count for r in rows)
    living = sum(r.count for r in rows if r.milestone_code not in _TERMINAL_MILESTONES)
    if total <= 0 or living > 0:
        return False
    _free_slots_for_batch(session=session, batch_id=batch.id)
    batch.archived_at = datetime.now(timezone.utc)
    session.add(batch)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_archived,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=f"Batch {batch.variety_name} completed — auto-archived",
    )
    return True


def _consume_seed_for_batch(
    *,
    session: Session,
    current_user: User,
    item_id: uuid.UUID,
    seeds_needed: int,
    batch_id: uuid.UUID,
) -> None:
    item = inv_repo.get_by_id(session=session, item_id=item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Seed inventory item not found")
    if not current_user.is_superuser and item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if item.category != InventoryCategory.seeds:
        raise HTTPException(
            status_code=400, detail="Selected inventory item is not a seed"
        )
    if item.current_stock < seeds_needed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"INSUFFICIENT_SEED_STOCK: need {seeds_needed}, "
                f"have {int(item.current_stock)}"
            ),
        )
    cost_total = (
        round(seeds_needed * item.unit_cost, 4) if item.unit_cost is not None else None
    )
    item.current_stock = max(item.current_stock - seeds_needed, 0)
    session.add(item)
    movement = InventoryMovement(
        item_id=item.id,
        movement_type=MovementType.consume,
        quantity=float(seeds_needed),
        cost_total=cost_total,
        related_batch_id=batch_id,
    )
    inv_repo.add_movement(session=session, movement=movement)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.inventory_consumed,
        target_type=TargetType.inventory_item,
        target_id=item.id,
        summary=f"{item.name} consumed ({seeds_needed:g} {item.unit.value}) for batch",
        meta={
            "movement_type": MovementType.consume.value,
            "quantity": seeds_needed,
            "cost_total": cost_total,
            "related_batch_id": str(batch_id),
        },
    )


def create_batch(*, session: Session, current_user: User, data: BatchCreate) -> Batch:
    setup = setups_repo.get_by_id(session=session, setup_id=data.setup_id)
    if setup is None:
        raise HTTPException(status_code=404, detail="Setup not found")
    if not current_user.is_superuser and setup.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if setup.archived_at is not None:
        raise HTTPException(status_code=400, detail="Setup is archived")
    if not current_user.is_superuser:
        enforce_active_batch_limit(
            session=session, user_id=current_user.id, tier=current_user.tier
        )
    empty_slots = _get_empty_slots(
        session=session, setup_id=setup.id, count=data.slots_used
    )
    if len(empty_slots) < data.slots_used:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough empty slots: need {data.slots_used}, "
                f"have {len(empty_slots)}"
            ),
        )
    initial_count = data.slots_used * data.seeds_per_slot
    payload = {
        "setup_id": data.setup_id,
        "crop_guide_id": data.crop_guide_id,
        "seed_inventory_item_id": data.seed_inventory_item_id,
        "variety_name": data.variety_name,
        "initial_count": initial_count,
        "slots_used": data.slots_used,
        "seeds_per_slot": data.seeds_per_slot,
        "notes": data.notes,
        "owner_id": current_user.id,
    }
    if data.started_at is not None:
        payload["started_at"] = data.started_at
    db = Batch.model_validate(payload)
    batch = batches_repo.create(session=session, batch=db)
    _consume_seed_for_batch(
        session=session,
        current_user=current_user,
        item_id=data.seed_inventory_item_id,
        seeds_needed=initial_count,
        batch_id=batch.id,
    )
    for slot in empty_slots:
        slot.batch_id = batch.id
        slot.status = SlotStatus.PLANTED
        session.add(slot)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_created,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=f"Batch {batch.variety_name} started ({initial_count} seeds)",
        meta={
            "setup_id": str(batch.setup_id),
            "variety_name": batch.variety_name,
            "initial_count": initial_count,
        },
    )
    session.commit()
    session.refresh(batch)
    return batch


def update_batch(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchUpdate,
) -> Batch:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    update_data = data.model_dump(exclude_unset=True)
    new_setup_id = update_data.get("setup_id")
    if new_setup_id is not None and new_setup_id != batch.setup_id:
        if batch.archived_at is not None:
            raise HTTPException(
                status_code=400, detail="Cannot move archived batch to another setup"
            )
        new_setup = setups_repo.get_by_id(session=session, setup_id=new_setup_id)
        if new_setup is None:
            raise HTTPException(status_code=404, detail="Setup not found")
        if not current_user.is_superuser and new_setup.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        if new_setup.archived_at is not None:
            raise HTTPException(status_code=400, detail="Setup is archived")
        slots_needed = batch.slots_used or 0
        if slots_needed > 0:
            empty_slots = _get_empty_slots(
                session=session, setup_id=new_setup.id, count=slots_needed
            )
            if len(empty_slots) < slots_needed:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough empty slots in target setup: "
                        f"need {slots_needed}, have {len(empty_slots)}"
                    ),
                )
            _free_slots_for_batch(session=session, batch_id=batch.id)
            for slot in empty_slots:
                slot.batch_id = batch.id
                slot.status = SlotStatus.PLANTED
                session.add(slot)
    return batches_repo.update(session=session, batch=batch, update_data=update_data)


def allocate_slots(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    slots_used: int,
    seeds_per_slot: int,
) -> Batch:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    if batch.archived_at is not None:
        raise HTTPException(
            status_code=400, detail="Cannot allocate slots for archived batch"
        )
    current_slots = batch.slots_used or 0
    delta = slots_used - current_slots
    if delta > 0:
        empty_slots = _get_empty_slots(
            session=session, setup_id=batch.setup_id, count=delta
        )
        if len(empty_slots) < delta:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough empty slots: need {delta} more, "
                    f"have {len(empty_slots)}"
                ),
            )
        for slot in empty_slots:
            slot.batch_id = batch.id
            slot.status = SlotStatus.PLANTED
            session.add(slot)
    elif delta < 0:
        to_free = (
            select(SetupSlot)
            .where(SetupSlot.batch_id == batch.id)
            .order_by(col(SetupSlot.position_index).desc())
            .limit(-delta)
        )
        for slot in session.exec(to_free).all():
            slot.batch_id = None
            slot.status = SlotStatus.EMPTY
            session.add(slot)
    update_data: dict = {
        "slots_used": slots_used,
        "seeds_per_slot": seeds_per_slot,
    }
    has_transitions = (
        session.exec(
            select(func.count())
            .select_from(BatchTransition)
            .where(BatchTransition.batch_id == batch.id)
        ).one()
        > 0
    )
    if not has_transitions:
        new_initial = slots_used * seeds_per_slot
        update_data["initial_count"] = new_initial
        sowed = batches_repo.get_state_count(
            session=session, batch_id=batch.id, milestone=Milestone.Sowed
        )
        if sowed is not None:
            sowed.count = new_initial
            sowed.updated_at = datetime.now(timezone.utc)
            session.add(sowed)
        else:
            session.add(
                BatchStateCount(
                    batch_id=batch.id,
                    milestone_code=Milestone.Sowed,
                    count=new_initial,
                )
            )
    return batches_repo.update(
        session=session,
        batch=batch,
        update_data=update_data,
    )


def archive_batch(
    *, session: Session, current_user: User, batch_id: uuid.UUID
) -> Batch:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    _free_slots_for_batch(session=session, batch_id=batch.id)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_archived,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=f"Batch {batch.variety_name} archived",
    )
    return batches_repo.update(
        session=session,
        batch=batch,
        update_data={"archived_at": datetime.now(timezone.utc)},
    )


def delete_batch(*, session: Session, current_user: User, batch_id: uuid.UUID) -> None:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    _free_slots_for_batch(session=session, batch_id=batch.id)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_deleted,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=f"Batch {batch.variety_name} deleted",
    )
    session.commit()
    batches_repo.delete(session=session, batch=batch)


def record_transition(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchTransitionCreate,
) -> BatchTransition:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    if data.from_milestone == data.to_milestone:
        raise HTTPException(
            status_code=400, detail="from_milestone must differ from to_milestone"
        )
    src = batches_repo.get_state_count(
        session=session, batch_id=batch.id, milestone=data.from_milestone
    )
    available = src.count if src else 0
    if data.count > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} units in {data.from_milestone.value}",
        )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=data.from_milestone,
        delta=-data.count,
    )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=data.to_milestone,
        delta=data.count,
    )
    transition = BatchTransition(
        batch_id=batch.id,
        from_milestone=data.from_milestone,
        to_milestone=data.to_milestone,
        count=data.count,
        occurred_at=data.occurred_at or datetime.now(timezone.utc),
        notes=data.notes,
        photo_url=data.photo_url,
        user_id=current_user.id,
    )
    batches_repo.add_transition(session=session, transition=transition)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_transition,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=(
            f"{batch.variety_name}: {data.count} "
            f"{data.from_milestone.value} → {data.to_milestone.value}"
        ),
        meta={
            "from": data.from_milestone.value,
            "to": data.to_milestone.value,
            "count": data.count,
        },
    )
    _maybe_auto_archive(session=session, current_user=current_user, batch=batch)
    session.commit()
    session.refresh(transition)
    return transition


def list_state_counts(*, session: Session, current_user: User, batch_id: uuid.UUID):
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    return batches_repo.list_state_counts(session=session, batch_id=batch.id)


def list_transitions(
    *, session: Session, current_user: User, batch_id: uuid.UUID, limit: int = 20
):
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    return batches_repo.list_transitions(
        session=session, batch_id=batch.id, limit=limit
    )


def record_harvest(
    *,
    session: Session,
    current_user: User,
    batch_id: uuid.UUID,
    data: BatchHarvestCreate,
) -> BatchHarvest:
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    src = batches_repo.get_state_count(
        session=session, batch_id=batch.id, milestone=Milestone.HarvestReady
    )
    available = src.count if src else 0
    if data.count > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} units in HarvestReady",
        )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=Milestone.HarvestReady,
        delta=-data.count,
    )
    batches_repo.upsert_state_count(
        session=session,
        batch_id=batch.id,
        milestone=Milestone.Harvested,
        delta=data.count,
    )
    harvest = BatchHarvest(
        batch_id=batch.id,
        weight_grams=data.weight_grams,
        count=data.count,
        harvested_at=data.harvested_at or datetime.now(timezone.utc),
        notes=data.notes,
    )
    batches_repo.add_harvest(session=session, harvest=harvest)
    activity_service.record(
        session=session,
        user_id=current_user.id,
        action_type=ActivityType.batch_harvest,
        target_type=TargetType.batch,
        target_id=batch.id,
        summary=(
            f"Harvested {data.count} of {batch.variety_name} ({data.weight_grams:g}g)"
        ),
        meta={
            "count": data.count,
            "weight_grams": data.weight_grams,
        },
    )
    _maybe_auto_archive(session=session, current_user=current_user, batch=batch)
    session.commit()
    session.refresh(harvest)
    return harvest


def list_harvests(*, session: Session, current_user: User, batch_id: uuid.UUID):
    batch = get_batch(session=session, current_user=current_user, batch_id=batch_id)
    return batches_repo.list_harvests(session=session, batch_id=batch.id)


def compute_seed_cost(*, session: Session, batch_id: uuid.UUID) -> float | None:
    from app.modules.inventory.models import InventoryMovement
    from app.modules.inventory.schema import MovementType

    q = select(func.coalesce(func.sum(InventoryMovement.cost_total), 0.0)).where(
        InventoryMovement.related_batch_id == batch_id,
        InventoryMovement.movement_type == MovementType.consume,
    )
    total = session.exec(q).one()
    has_consume_q = (
        select(func.count())
        .select_from(InventoryMovement)
        .where(
            InventoryMovement.related_batch_id == batch_id,
            InventoryMovement.movement_type == MovementType.consume,
        )
    )
    has_any = session.exec(has_consume_q).one() > 0
    if not has_any:
        return None
    return float(total or 0.0)
