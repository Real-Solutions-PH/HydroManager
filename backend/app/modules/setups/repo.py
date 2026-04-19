import uuid
from typing import Any

from sqlmodel import Session, col, func, select

from app.modules.setups.models import Setup, SetupPhoto, SetupSlot


def get_by_id(*, session: Session, setup_id: uuid.UUID) -> Setup | None:
    return session.get(Setup, setup_id)


def get_multi(
    *,
    session: Session,
    owner_id: uuid.UUID | None = None,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Setup], int]:
    count_q = select(func.count()).select_from(Setup)
    list_q = (
        select(Setup).order_by(col(Setup.created_at).desc()).offset(skip).limit(limit)
    )
    if owner_id is not None:
        count_q = count_q.where(Setup.owner_id == owner_id)
        list_q = list_q.where(Setup.owner_id == owner_id)
    if not include_archived:
        count_q = count_q.where(Setup.archived_at.is_(None))  # type: ignore
        list_q = list_q.where(Setup.archived_at.is_(None))  # type: ignore
    count = session.exec(count_q).one()
    rows = session.exec(list_q).all()
    return list(rows), count


def create(*, session: Session, setup: Setup, slot_codes: list[str]) -> Setup:
    session.add(setup)
    session.flush()
    for idx, code in enumerate(slot_codes):
        session.add(
            SetupSlot(setup_id=setup.id, slot_code=code, position_index=idx)
        )
    session.commit()
    session.refresh(setup)
    return setup


def update(*, session: Session, setup: Setup, update_data: dict[str, Any]) -> Setup:
    setup.sqlmodel_update(update_data)
    session.add(setup)
    session.commit()
    session.refresh(setup)
    return setup


def delete(*, session: Session, setup: Setup) -> None:
    session.delete(setup)
    session.commit()


def list_slots(*, session: Session, setup_id: uuid.UUID) -> list[SetupSlot]:
    q = (
        select(SetupSlot)
        .where(SetupSlot.setup_id == setup_id)
        .order_by(col(SetupSlot.position_index).asc())
    )
    return list(session.exec(q).all())


def list_photos(*, session: Session, setup_id: uuid.UUID) -> list[SetupPhoto]:
    q = (
        select(SetupPhoto)
        .where(SetupPhoto.setup_id == setup_id)
        .order_by(col(SetupPhoto.uploaded_at).desc())
    )
    return list(session.exec(q).all())


def add_photo(*, session: Session, photo: SetupPhoto) -> SetupPhoto:
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo
