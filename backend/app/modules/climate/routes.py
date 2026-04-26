from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.modules.climate import service
from app.modules.climate.providers import list_providers
from app.modules.climate.schema import ClimateNormals
from app.modules.iam.deps import CurrentUser

router = APIRouter(prefix="/climate", tags=["climate"])


@router.get("/providers")
def get_providers(
    current_user: CurrentUser,  # noqa: ARG001
) -> dict[str, list[str]]:
    return {"providers": list_providers()}


@router.get("/normals", response_model=ClimateNormals)
async def get_normals(
    current_user: CurrentUser,  # noqa: ARG001
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    month: int = Query(..., ge=1, le=12),
    provider: str | None = Query(None, description="open_meteo | nasa_power"),
) -> Any:
    try:
        return await service.fetch_normals(
            lat=lat, lon=lon, month=month, provider=provider
        )
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Climate provider failed: {exc}"
        ) from exc
