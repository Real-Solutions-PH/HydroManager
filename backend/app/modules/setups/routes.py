import uuid
from typing import Any

from fastapi import APIRouter

from app.core.storage import rewrite_public_url
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
    data = [
        SetupPublic.model_validate(
            {
                **SetupPublic.model_validate(setup, from_attributes=True).model_dump(),
                "primary_photo_url": rewrite_public_url(photo_url),
            }
        )
        for setup, photo_url in rows
    ]
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
    photos_sorted = sorted(setup.photos, key=lambda p: p.uploaded_at, reverse=True)
    base = SetupPublic.model_validate(setup, from_attributes=True).model_dump()
    base["primary_photo_url"] = (
        rewrite_public_url(photos_sorted[0].storage_url) if photos_sorted else None
    )
    return SetupDetail(
        **base,
        slots=[
            SetupSlotPublic.model_validate(s, from_attributes=True)
            for s in setup.slots
        ],
        photos=[
            SetupPhotoPublic(
                id=p.id,
                storage_url=rewrite_public_url(p.storage_url) or p.storage_url,
                uploaded_at=p.uploaded_at,
            )
            for p in photos_sorted
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
    return [
        SetupPhotoPublic(
            id=p.id,
            storage_url=rewrite_public_url(p.storage_url) or p.storage_url,
            uploaded_at=p.uploaded_at,
        )
        for p in photos
    ]


@router.post("/{id}/photos", response_model=SetupPhotoPublic)
def add_photo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    data: SetupPhotoCreate,
) -> Any:
    p = setups_service.add_photo(
        session=session, current_user=current_user, setup_id=id, data=data
    )
    return SetupPhotoPublic(
        id=p.id,
        storage_url=rewrite_public_url(p.storage_url) or p.storage_url,
        uploaded_at=p.uploaded_at,
    )
