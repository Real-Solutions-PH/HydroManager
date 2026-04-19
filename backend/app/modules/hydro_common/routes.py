from typing import Any

from fastapi import APIRouter, File, Form, UploadFile

from app.modules.hydro_common.photos import upload_photo
from app.modules.iam.deps import CurrentUser

router = APIRouter(prefix="/hydro", tags=["hydro-common"])


@router.post("/photos/upload")
async def photo_upload(
    current_user: CurrentUser,
    scope: str = Form(..., description="e.g. setup, batch"),
    file: UploadFile = File(...),
) -> Any:
    url = await upload_photo(
        user_id=current_user.id, scope=scope, file=file
    )
    return {"url": url}
