import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session, col, select

from app.modules.hydro_common.quota import enforce_setup_limit
from app.modules.iam.users.models import User
from app.modules.setups import repo as setups_repo
from app.modules.setups.models import Setup, SetupPhoto, SetupSlot
from app.modules.setups.schema import (
    SetupCreate,
    SetupPhotoCreate,
    SetupType,
    SetupUpdate,
    SlotStatus,
)


def _default_slot_codes(prefix: str, count: int) -> list[str]:
    return [f"{prefix}-{i + 1:03d}" for i in range(count)]


def _prefix_for(type_value: str) -> str:
    mapping = {
        "DFT": "DFT",
        "NFT": "NFT",
        "DutchBucket": "DB",
        "Kratky": "KRT",
        "SNAP": "SNP",
    }
    return mapping.get(type_value, "SLT")


def _authorize(setup: Setup, user: User) -> None:
    if not user.is_superuser and setup.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")


def list_setups(
    *,
    session: Session,
    current_user: User,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[tuple[Setup, str | None]], int]:
    owner_id = None if current_user.is_superuser else current_user.id
    return setups_repo.get_multi(
        session=session,
        owner_id=owner_id,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )


def get_setup(
    *, session: Session, current_user: User, setup_id: uuid.UUID
) -> Setup:
    setup = setups_repo.get_by_id(session=session, setup_id=setup_id)
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")
    _authorize(setup, current_user)
    return setup


def create_setup(
    *, session: Session, current_user: User, data: SetupCreate
) -> Setup:
    if not current_user.is_superuser:
        enforce_setup_limit(
            session=session, user_id=current_user.id, tier=current_user.tier
        )
    payload = data.model_dump(exclude_none=True)
    payload["owner_id"] = current_user.id
    db = Setup.model_validate(payload)
    slot_codes = _default_slot_codes(_prefix_for(data.type.value), data.slot_count)
    return setups_repo.create(session=session, setup=db, slot_codes=slot_codes)


def _resize_slots(
    *, session: Session, setup: Setup, new_count: int, type_value: str
) -> None:
    if new_count == setup.slot_count:
        return
    slots_q = (
        select(SetupSlot)
        .where(SetupSlot.setup_id == setup.id)
        .order_by(col(SetupSlot.position_index).asc())
    )
    slots = list(session.exec(slots_q).all())
    if new_count > setup.slot_count:
        prefix = _prefix_for(type_value)
        for idx in range(setup.slot_count, new_count):
            session.add(
                SetupSlot(
                    setup_id=setup.id,
                    slot_code=f"{prefix}-{idx + 1:03d}",
                    position_index=idx,
                )
            )
    else:
        to_remove = slots[new_count:]
        for slot in to_remove:
            if slot.batch_id is not None or slot.status != SlotStatus.EMPTY:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Cannot shrink: trailing slots are occupied. "
                        "Archive batches first."
                    ),
                )
        for slot in to_remove:
            session.delete(slot)


def _rename_slot_codes(
    *, session: Session, setup_id: uuid.UUID, type_value: str
) -> None:
    prefix = _prefix_for(type_value)
    slots_q = (
        select(SetupSlot)
        .where(SetupSlot.setup_id == setup_id)
        .order_by(col(SetupSlot.position_index).asc())
    )
    for slot in session.exec(slots_q).all():
        slot.slot_code = f"{prefix}-{slot.position_index + 1:03d}"
        session.add(slot)


def update_setup(
    *,
    session: Session,
    current_user: User,
    setup_id: uuid.UUID,
    data: SetupUpdate,
) -> Setup:
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    payload = data.model_dump(exclude_unset=True)
    new_type = payload.get("type")
    new_slot_count = payload.pop("slot_count", None)
    type_for_codes = (
        new_type.value if isinstance(new_type, SetupType)
        else new_type if new_type
        else setup.type.value
    )
    if new_slot_count is not None:
        _resize_slots(
            session=session,
            setup=setup,
            new_count=new_slot_count,
            type_value=type_for_codes,
        )
        payload["slot_count"] = new_slot_count
    if new_type is not None:
        _rename_slot_codes(
            session=session, setup_id=setup.id, type_value=type_for_codes
        )
    elif new_slot_count is not None and new_slot_count > setup.slot_count:
        # new slots already named with current prefix; nothing extra
        pass
    return setups_repo.update(session=session, setup=setup, update_data=payload)


def archive_setup(
    *, session: Session, current_user: User, setup_id: uuid.UUID
) -> Setup:
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    return setups_repo.update(
        session=session,
        setup=setup,
        update_data={"archived_at": datetime.now(timezone.utc)},
    )


def delete_setup(
    *, session: Session, current_user: User, setup_id: uuid.UUID
) -> None:
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    if setup.archived_at is None:
        raise HTTPException(
            status_code=400, detail="Archive setup before deleting"
        )
    setups_repo.delete(session=session, setup=setup)


def list_slots(
    *, session: Session, current_user: User, setup_id: uuid.UUID
):
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    return setups_repo.list_slots(session=session, setup_id=setup.id)


def list_photos(
    *, session: Session, current_user: User, setup_id: uuid.UUID
):
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    return setups_repo.list_photos(session=session, setup_id=setup.id)


def add_photo(
    *,
    session: Session,
    current_user: User,
    setup_id: uuid.UUID,
    data: SetupPhotoCreate,
) -> SetupPhoto:
    setup = get_setup(
        session=session, current_user=current_user, setup_id=setup_id
    )
    photo = SetupPhoto(setup_id=setup.id, storage_url=data.storage_url)
    return setups_repo.add_photo(session=session, photo=photo)
