"""Document business logic — upload, list, retrieve."""

import logging
from typing import Any

from app.core.config import settings
from app.core.database import get_collection
from app.models.document import (
    COLLECTION_NAME,
    DocumentStatus,
    create_document_record,
    document_to_response,
)
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class DocumentService:
    async def create_upload(
        self,
        filename: str,
        content: bytes,
    ) -> dict[str, Any]:
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise ValueError(
                f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        if not filename:
            raise ValueError("Filename is required")

        storage_path, mime_type = await storage_service.save_file(filename, content)

        record = create_document_record(
            filename=filename,
            mime_type=mime_type,
            size_bytes=len(content),
            storage_path=storage_path,
            status=DocumentStatus.PENDING,
        )

        collection = get_collection(COLLECTION_NAME)
        await collection.insert_one(record)

        logger.info("Document created: %s", record["_id"])
        return document_to_response(record)

    async def list_documents(
        self,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        collection = get_collection(COLLECTION_NAME)
        skip = (page - 1) * page_size

        total = await collection.count_documents({})
        cursor = (
            collection.find({})
            .sort("uploaded_at", -1)
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)

        return {
            "items": [document_to_response(doc) for doc in docs],
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": skip + len(docs) < total,
        }

    async def get_document(self, document_id: str) -> dict[str, Any] | None:
        collection = get_collection(COLLECTION_NAME)
        doc = await collection.find_one({"_id": document_id})
        if doc is None:
            return None
        return document_to_response(doc)


document_service = DocumentService()
