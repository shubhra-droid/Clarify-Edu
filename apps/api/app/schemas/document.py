"""Document API schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime
    processed_at: datetime | None = None
    error_message: str | None = None
    parsed_sections: dict | None = None
    study_summary: str | None = None
    key_points: list[dict] = Field(default_factory=list)
    flashcards: list[dict] = Field(default_factory=list)
    mind_map_nodes: list[dict] = Field(default_factory=list)
    mind_map_edges: list[dict] = Field(default_factory=list)


class PaginatedDocumentsResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    has_more: bool
