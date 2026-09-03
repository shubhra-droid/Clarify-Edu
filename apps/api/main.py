"""ClarifyEdu API — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
from dotenv import load_dotenv
load_dotenv()


from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.cors import configure_cors
from app.core.database import close_mongodb_connection, connect_to_mongodb
from app.services.ai_service import ai_service
from app.services.document_store import document_store

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

    @app.get("/api/generate-mindmap")
    @app.get("/api/v1/generate-mindmap")
    async def generate_mindmap(document_id: str):
        from app.services.document_store import document_store
        materials = await document_store.get_study_materials(document_id)
        if not materials:
            return {"nodes": [], "edges": [], "error": "Not yet generated"}
        return {"nodes": materials.get("mind_map_nodes", []), "edges": materials.get("mind_map_edges", [])}

    @app.get("/api/generate-studyplan")
    @app.get("/api/v1/generate-studyplan")
    async def generate_studyplan(document_id: str):
        from app.services.document_store import document_store
        materials = await document_store.get_study_materials(document_id)
        if not materials:
            return {"outline": [], "milestones": [], "key_points": [], "error": "Not yet generated"}
        return {
            "title": materials.get("title"),
            "overview": materials.get("overview"),
            "outline": materials.get("sections", []),
            "key_points": materials.get("key_definitions", []),
        }

    return app


app = create_app()
