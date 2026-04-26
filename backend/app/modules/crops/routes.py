import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.modules.crops import repo as crops_repo
from app.modules.crops import stats_repo as crops_stats_repo
from app.modules.crops.schema import (
    CropCategory,
    CropGuidePublic,
    CropGuidesPublic,
)
from app.modules.crops.stats_schema import (
    CropStatsRecomputeResponse,
    CropStatsResponse,
    CropStatValue,
)
from app.modules.iam.deps import CurrentUser
from app.shared.deps import SessionDep

router = APIRouter(prefix="/crops", tags=["crops"])


@router.get("/", response_model=CropGuidesPublic)
def list_crops(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    query: str | None = None,
    category: CropCategory | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = crops_repo.get_multi(
        session=session,
        query=query,
        category=category.value if category else None,
        skip=skip,
        limit=limit,
    )
    data = [CropGuidePublic.model_validate(r, from_attributes=True) for r in rows]
    return CropGuidesPublic(data=data, count=count)


@router.get("/stats", response_model=CropStatsResponse)
def read_crop_stats(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
) -> Any:
    rows = crops_stats_repo.get_all_stats(session=session)
    return CropStatsResponse(
        stats={
            r.field: CropStatValue(min=r.min_value, max=r.max_value, avg=r.avg_value)
            for r in rows
        }
    )


@router.post("/stats/recompute", response_model=CropStatsRecomputeResponse)
def recompute_crop_stats(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
) -> Any:
    updated = crops_stats_repo.recompute_stats(session=session)
    return CropStatsRecomputeResponse(updated_fields=updated)


@router.get("/{id}", response_model=CropGuidePublic)
def read_crop(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    id: uuid.UUID,
) -> Any:
    crop = crops_repo.get_by_id(session=session, crop_id=id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop guide not found")
    return crop


@router.post("/seed")
def seed_crops(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
) -> dict:
    inserted = crops_repo.seed_if_empty(session=session)
    return {"inserted": inserted}
