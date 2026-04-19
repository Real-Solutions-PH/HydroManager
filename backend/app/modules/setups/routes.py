import uuid
from typing import Any

from fastapi import APIRouter

from app.modules.iam.deps import CurrentUser
from app.modules.setups import services as setups_service
from app.modules.setups.schema import (
    SetupCreate,
    SetupDetail,
    SetupPhotoCreate,
    SetupPhotoPublic,
    SetupPublic,
    SetupSlotPublic,
    SetupsPublic,
    SetupUpdate,
)
from app.shared.deps import SessionDep
from app.shared.schema import Message

router = APIRouter(prefix="/setups", tags=["setups"])


@router.get("/", response_model=SetupsPublic)
def list_setups(
    session: SessionDep,
    current_user: CurrentUser,
    include_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = setups_service.list_setups(
        session=session,
        current_user=current_user,
        include_archived=include_archived,
        skip=skip,
        limit=limit,
    )
    data = [SetupPublic.model_validate(r, from_attributes=True) for r in rows]
    return SetupsPublic(data=data, count=count)


@router.post("/", response_model=SetupPublic)
def create_setup(
    *, session: SessionDep, current_user: CurrentUser, data: SetupCreate
) -> Any:
    return setups_service.create_setup(
        session=session, current_user=current_user, data=data
    )


@router.get("/{id}", response_model=SetupDetail)
def read_setup(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    setup = setups_service.get_setup(
        session=session, current_user=current_user, setup_id=id
    )
    return SetupDetail(
        **SetupPublic.model_validate(setup, from_attributes=True).model_dump(),
        slots=[
            SetupSlotPublic.model_validate(s, from_attributes=True)
            for s in setup.slots
        ],
        photos=[
            SetupPhotoPublic.model_validate(p, from_attributes=True)
            for p in setup.photos
        ],
    )


@router.put("/{id}", response_model=SetupPublic)
def update_setup(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: SetupUpdate,
) -> Any:
    return setups_service.update_setup(
        session=session, current_user=current_user, setup_id=id, data=data
    )


@router.post("/{id}/archive", response_model=SetupPublic)
def archive_setup(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    return setups_service.archive_setup(
        session=session, current_user=current_user, setup_id=id
    )


@router.delete("/{id}")
def delete_setup(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    setups_service.delete_setup(
        session=session, current_user=current_user, setup_id=id
    )
    return Message(message="Setup deleted successfully")


@router.get("/{id}/slots", response_model=list[SetupSlotPublic])
def list_slots(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    slots = setups_service.list_slots(
        session=session, current_user=current_user, setup_id=id
    )
    return [SetupSlotPublic.model_validate(s, from_attributes=True) for s in slots]


@router.get("/{id}/photos", response_model=list[SetupPhotoPublic])
def list_photos(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    photos = setups_service.list_photos(
        session=session, current_user=current_user, setup_id=id
    )
    return [SetupPhotoPublic.model_validate(p, from_attributes=True) for p in photos]


@router.post("/{id}/photos", response_model=SetupPhotoPublic)
def add_photo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: SetupPhotoCreate,
) -> Any:
    return setups_service.add_photo(
        session=session, current_user=current_user, setup_id=id, data=data
    )
