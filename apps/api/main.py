"""ClarifyEdu API — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.cors import configure_cors
from app.core.database import close_mongodb_connection, connect_to_mongodb

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — startup and shutdown hooks."""
    try:
        await connect_to_mongodb()
    except Exception as exc:
        logger.error("MongoDB connection failed: %s", exc)
        if settings.ENVIRONMENT == "production":
            raise

    yield

    await close_mongodb_connection()


def create_app() -> FastAPI:
    """Application factory — keeps testability and config injection clean."""
    app = FastAPI(
        title=settings.APP_NAME,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    configure_cors(app)
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    # Mount static files upload directory
    from fastapi.staticfiles import StaticFiles
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    return app


app = create_app()
