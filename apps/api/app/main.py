"""ClarifyEdu API — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.core.cors import configure_cors
from app.core.database import close_mongodb_connection, connect_to_mongodb
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — startup and shutdown hooks."""
    import asyncio
    max_retries = 3
    base_delay = 1
    for attempt in range(max_retries):
        try:
            await connect_to_mongodb()
            break
        except Exception as exc:
            logger.error("MongoDB connection failed (attempt %d): %s", attempt + 1, exc)
            if attempt == max_retries - 1:
                logger.warning("MongoDB failed after max retries. App will run in fallback mode.")
            else:
                await asyncio.sleep(base_delay * (2 ** attempt))

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
    
    @app.get("/api/generate-mindmap")
    async def generate_mindmap(document_id: str | None = None):
        try:
            payload = ai_service._generate_mock_payload("mock_document.pdf", "mock text")
            return {
                "nodes": [n.model_dump() for n in payload.mind_map_nodes],
                "edges": [e.model_dump() for e in payload.mind_map_edges]
            }
        except Exception as exc:
            return {"nodes": [], "edges": [], "error": str(exc)}
            
    @app.get("/api/generate-studyplan")
    async def generate_studyplan(document_id: str | None = None):
        try:
            payload = ai_service._generate_mock_payload("mock_document.pdf", "mock text")
            return {
                "outline": [n.model_dump() for n in payload.structured_notes],
                "milestones": payload.adhd_bullet_summary,
                "key_points": [n.model_dump() for n in payload.key_definitions],
            }
        except Exception as exc:
            return {"outline": [], "milestones": [], "error": str(exc)}

    @app.get("/api/v1/health")
    async def health_check():
        from app.services.document_store import document_store
        mongo_up = False
        try:
            from app.core.database import get_collection
            from app.models.document import COLLECTION_NAME
            # quick ping wrapper
            collection = get_collection(COLLECTION_NAME)
            await collection.database.command("ping")
            mongo_up = True
        except Exception:
            pass
        return {"mongo": "up" if mongo_up else "down", "fallback_store_count": document_store.get_fallback_count()}

    # Mount static files upload directory
    from fastapi.staticfiles import StaticFiles
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    return app


app = create_app()
