import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.modules.iam.deps import CurrentUser
from app.modules.library_guides import repo as guides_repo
from app.modules.library_guides.schema import (
    GuideCategory,
    LibraryGuidePublic,
    LibraryGuidesPublic,
)
from app.shared.deps import SessionDep

router = APIRouter(prefix="/library/guides", tags=["library-guides"])


@router.get("/", response_model=LibraryGuidesPublic)
def list_guides(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    query: str | None = None,
    category: GuideCategory | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = guides_repo.get_multi(
        session=session,
        query=query,
        category=category.value if category else None,
        skip=skip,
        limit=limit,
    )
    data = [LibraryGuidePublic.model_validate(r, from_attributes=True) for r in rows]
    return LibraryGuidesPublic(data=data, count=count)


@router.get("/{id}", response_model=LibraryGuidePublic)
def read_guide(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    id: uuid.UUID,
) -> Any:
    guide = guides_repo.get_by_id(session=session, guide_id=id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    return guide


@router.post("/seed")
def seed_guides(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
) -> dict:
    inserted = guides_repo.seed_if_empty(session=session)
    return {"inserted": inserted}
