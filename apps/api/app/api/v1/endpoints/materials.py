"""Endpoints for retrieving adaptive study materials and processing status."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import require_database
from app.core.database import get_collection
from app.schemas.adaptive_material import AdaptiveStudyMaterial
from app.schemas.document import DocumentResponse
from app.models.document import COLLECTION_NAME as DOC_COLLECTION, document_to_response
from app.workers.tasks import STUDY_MATERIALS_COLLECTION

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Materials"])


@router.get(
    "/materials/{document_id}",
    response_model=AdaptiveStudyMaterial,
    summary="Get transformed adaptive study material by document ID",
    dependencies=[Depends(require_database)],
)
async def get_study_material(document_id: str) -> AdaptiveStudyMaterial:
    """Retrieve the generated cognitive formats and study resources for a document."""
    collection = get_collection(STUDY_MATERIALS_COLLECTION)
    material_data = await collection.find_one({"document_id": document_id})
    
    if not material_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adaptive study material not found or processing has not completed yet",
        )
        
    return AdaptiveStudyMaterial(**material_data)


@router.get(
    "/documents/{document_id}/status",
    response_model=DocumentResponse,
    summary="Get document processing status",
    dependencies=[Depends(require_database)],
)
async def get_document_status(document_id: str) -> DocumentResponse:
    """Retrieve current processing status (e.g. pending, extracting, completed, failed)."""
    collection = get_collection(DOC_COLLECTION)
    doc = await collection.find_one({"_id": document_id})
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document record not found",
        )
        
    return DocumentResponse(**document_to_response(doc))
