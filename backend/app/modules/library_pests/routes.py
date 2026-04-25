import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app.modules.iam.deps import CurrentUser
from app.modules.library_pests import repo as pests_repo
from app.modules.library_pests.schema import (
    LibraryPestPublic,
    LibraryPestsPublic,
    PestKind,
)
from app.shared.deps import SessionDep

router = APIRouter(prefix="/library/pests", tags=["library-pests"])


@router.get("/", response_model=LibraryPestsPublic)
def list_pests(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    query: str | None = None,
    kind: PestKind | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    rows, count = pests_repo.get_multi(
        session=session,
        query=query,
        kind=kind.value if kind else None,
        skip=skip,
        limit=limit,
    )
    data = [LibraryPestPublic.model_validate(r, from_attributes=True) for r in rows]
    return LibraryPestsPublic(data=data, count=count)


@router.get("/{id}", response_model=LibraryPestPublic)
def read_pest(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
    id: uuid.UUID,
) -> Any:
    pest = pests_repo.get_by_id(session=session, pest_id=id)
    if not pest:
        raise HTTPException(status_code=404, detail="Pest not found")
    return pest


@router.post("/seed")
def seed_pests(
    session: SessionDep,
    current_user: CurrentUser,  # noqa: ARG001
) -> dict:
    inserted = pests_repo.seed_if_empty(session=session)
    return {"inserted": inserted}
