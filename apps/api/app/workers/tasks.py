"""Asynchronous background tasks for document transformation with threaded fallback."""

import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Any

from celery import Celery

from app.core.config import settings
from app.core.database import connect_to_mongodb, get_collection
from app.models.document import COLLECTION_NAME as DOC_COLLECTION, DocumentStatus
from app.services.extraction_service import extraction_service

from app.services.tts_service import tts_service

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "clarify_edu_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)
celery_app.conf.update(
    task_always_eager=settings.ENVIRONMENT == "development",
    task_ignore_result=True,
)

STUDY_MATERIALS_COLLECTION = "study_materials"


async def process_document_async(document_id: str) -> None:
    """Asynchronous pipeline: Extraction -> AI Orchestration -> TTS -> Save."""
    logger.info("Starting async document processing pipeline for ID: %s", document_id)
    await connect_to_mongodb()
    doc_collection = get_collection(DOC_COLLECTION)
    materials_collection = get_collection(STUDY_MATERIALS_COLLECTION)

    # 1. Fetch document record
    doc = await doc_collection.find_one({"_id": document_id})
    if not doc:
        logger.error("Document ID %s not found in database", document_id)
        return

    try:
        # 2. Extract Text
        from app.services.document_store import document_store
        await document_store.update_status(document_id, "extracting")
        
        logger.info("Extracting text for document %s...", document_id)
        extracted_text = extraction_service.extract_text(
            doc["storage_path"], doc["mime_type"]
        )

        if not extracted_text.strip():
            raise ValueError("No text could be extracted from this document.")

        # 3. AI Transformation
        from app.services.document_store import document_store
        await document_store.update_status(document_id, "processing")
        
        logger.info("Generating study material with AI for document %s...", document_id)
        from app.services.llm_service import generate_study_materials
        
        material = await generate_study_materials(
            document_text=extracted_text,
            filename=doc["filename"]
        )

        from datetime import datetime, timezone
        material["id"] = document_id
        material["document_id"] = document_id
        material["created_at"] = datetime.now(timezone.utc).isoformat()
        material["updated_at"] = datetime.now(timezone.utc).isoformat()

        # 4. Save materials & complete
        await document_store.save_study_materials(document_id, material)
        await document_store.update_status(document_id, "completed")
        logger.info("Successfully completed processing for document %s", document_id)

    except Exception as exc:
        logger.exception("Failed to process document %s", document_id)
        from app.services.document_store import document_store
        await document_store.update_status(document_id, "failed", error_message=str(exc))


def run_async_loop(coro: Any) -> None:
    """Helper to run async coroutines in a background thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="process_document_task")
def process_document_task(document_id: str) -> None:
    """Celery task entrypoint."""
    logger.info("Celery task picked up processing for document ID: %s", document_id)
    asyncio.run(process_document_async(document_id))


def trigger_process_document(document_id: str) -> None:
    """Ingest entrypoint: tries Celery, falls back to a daemon thread if Redis/Celery fails."""
    # If in development or Celery runs into connection errors, fall back to threading
    try:
        # We try to inspect if celery is working or task can delay
        if settings.ENVIRONMENT == "production":
            process_document_task.delay(document_id)
            logger.info("Successfully enqueued document %s on Celery worker pool.", document_id)
            return
    except Exception as exc:
        logger.warning("Celery enqueue failed: %s. Falling back to background thread.", exc)

    # Threading Fallback
    logger.info("Starting background thread task for document %s", document_id)
    thread = threading.Thread(
        target=run_async_loop,
        args=(process_document_async(document_id),),
        name=f"ClarifyEdu-Process-{document_id}",
    )
    thread.daemon = True
    thread.start()
