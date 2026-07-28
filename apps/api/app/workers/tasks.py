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
from app.services.ai_service import ai_service
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
        await doc_collection.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.EXTRACTING.value}},
        )
        logger.info("Extracting text for document %s...", document_id)
        extracted_text = extraction_service.extract_text(
            doc["storage_path"], doc["mime_type"]
        )

        if not extracted_text.strip():
            raise ValueError("No text could be extracted from this document.")

        # 3. AI Transformation
        await doc_collection.update_one(
            {"_id": document_id},
            {"$set": {"status": DocumentStatus.PROCESSING.value}},
        )
        logger.info("Generating study material with AI for document %s...", document_id)
        material = await ai_service.generate_material(
            document_id=document_id,
            filename=doc["filename"],
            content=extracted_text,
        )

        # 4. Generate TTS Voiceover & Sync word timestamps
        logger.info("Generating TTS segments for document %s...", document_id)
        for segment in material.tts_script:
            updated_seg = await tts_service.generate_speech(segment.id, segment.text)
            segment.audio_url = updated_seg.audio_url
            segment.word_timestamps = updated_seg.word_timestamps

        # 5. Persist Adaptive Study Material
        # Convert pydantic model to dictionary for MongoDB insert
        material_dict = material.model_dump()
        
        # Upsert material details
        await materials_collection.update_one(
            {"document_id": document_id},
            {"$set": material_dict},
            upsert=True,
        )

        # 6. Mark Document as Completed
        now = datetime.now(timezone.utc)
        parsed_sections = {
            "summary": material.summary,
            "key_points": [entry.model_dump() for entry in material.key_definitions],
            "flashcards": [card.model_dump() for card in material.flashcards],
            "mind_map_nodes": [node.model_dump() for node in material.mind_map.nodes],
            "mind_map_edges": [edge.model_dump() for edge in material.mind_map.edges],
        }
        await doc_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.COMPLETED.value,
                    "processed_at": now,
                    "error_message": None,
                    "parsed_sections": parsed_sections,
                    "study_summary": material.summary,
                    "key_points": parsed_sections["key_points"],
                    "flashcards": parsed_sections["flashcards"],
                    "mind_map_nodes": parsed_sections["mind_map_nodes"],
                    "mind_map_edges": parsed_sections["mind_map_edges"],
                }
            },
        )
        logger.info("Successfully completed processing for document %s", document_id)

    except Exception as exc:
        logger.exception("Failed to process document %s", document_id)
        # Mark document as failed
        await doc_collection.update_one(
            {"_id": document_id},
            {
                "$set": {
                    "status": DocumentStatus.FAILED.value,
                    "error_message": str(exc),
                    "processed_at": datetime.now(timezone.utc),
                }
            },
        )


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
