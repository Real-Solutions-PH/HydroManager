import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from sqlmodel import Session
from starlette.middleware.cors import CORSMiddleware

from app.api import v1_router
from app.core.config import settings
from app.core.db import engine
from app.core.storage import ensure_bucket
from app.logger import app_logger
from app.modules.crops import repo as crops_repo
from app.modules.library_guides import repo as guides_repo
from app.modules.library_pests import repo as pests_repo


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)


IS_SERVERLESS = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        ensure_bucket(settings.MINIO_DEFAULT_BUCKET)
        if settings.OCR_ENABLED:
            ensure_bucket(settings.OCR_BUCKET)
    except Exception as exc:
        app_logger.warning("Object storage unavailable, skipping bucket setup: %s", exc)
    with Session(engine) as session:
        try:
            app_logger.info("Running seeding script")
            crops_repo.seed_if_empty(session=session)
            guides_repo.seed_if_empty(session=session)
            pests_repo.seed_if_empty(session=session)
        except Exception:
            session.rollback()
            app_logger.exception("Seeding scripts didn't run properly")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(v1_router, prefix=settings.API_V1_STR)
