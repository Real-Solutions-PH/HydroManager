"""Photo upload helpers for setups/batches. Uses existing MinIO/S3 engine."""

import uuid

from fastapi import HTTPException, UploadFile

from app.core.storage import MinioEngine

HYDRO_BUCKET = "hydromanager-photos"
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


async def upload_photo(
    *, user_id: uuid.UUID, scope: str, file: UploadFile
) -> str:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content-type. Allowed: {sorted(ALLOWED_MIME)}",
        )
    body = await file.read()
    if len(body) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413, detail="Photo exceeds 10 MB limit"
        )
    engine = MinioEngine.get_instance()
    engine.ensure_bucket(HYDRO_BUCKET)
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() or "jpg"
    key = f"{scope}/{user_id}/{uuid.uuid4()}.{ext}"
    engine.upload_file(
        bucket=HYDRO_BUCKET,
        key=key,
        data=body,
        content_type=file.content_type or "application/octet-stream",
    )
    return engine.generate_presigned_url(
        bucket=HYDRO_BUCKET, key=key, expires_in=60 * 60 * 24 * 30
    )
