"""Document persistence model helpers."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4


class DocumentStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


COLLECTION_NAME = "documents"


def create_document_record(
    *,
    filename: str,
    mime_type: str,
    size_bytes: int,
    storage_path: str,
    status: DocumentStatus = DocumentStatus.PENDING,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "_id": str(uuid4()),
        "filename": filename,
        "mime_type": mime_type,
        "size_bytes": size_bytes,
        "storage_path": storage_path,
        "status": status.value,
        "uploaded_at": now,
        "processed_at": None,
        "error_message": None,
        "parsed_sections": None,
        "study_summary": None,
        "key_points": [],
        "flashcards": [],
        "mind_map_nodes": [],
        "mind_map_edges": [],
    }


def document_to_response(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc["_id"],
        "filename": doc["filename"],
        "mime_type": doc["mime_type"],
        "size_bytes": doc["size_bytes"],
        "status": doc["status"],
        "uploaded_at": doc["uploaded_at"],
        "processed_at": doc.get("processed_at"),
        "error_message": doc.get("error_message"),
        "parsed_sections": doc.get("parsed_sections"),
        "study_summary": doc.get("study_summary"),
        "key_points": doc.get("key_points", []),
        "flashcards": doc.get("flashcards", []),
        "mind_map_nodes": doc.get("mind_map_nodes", []),
        "mind_map_edges": doc.get("mind_map_edges", []),
    }
