"""Document upload and retrieval endpoints."""

import traceback

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status


from app.schemas.document import DocumentResponse, PaginatedDocumentsResponse
from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a study document",
    
)
async def upload_document(
    file: UploadFile = File(..., description="PDF, TXT, or DOCX file"),
) -> DocumentResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    content = await file.read()

    try:
        result = await document_service.create_upload(
            filename=file.filename,
            content=content,
        )
        # Trigger background text extraction and AI parsing
        from app.workers.tasks import trigger_process_document
        trigger_process_document(result["id"])
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        print(f"Document upload failed: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable",
        ) from exc

    return DocumentResponse(**result)


@router.get(
    "",
    response_model=PaginatedDocumentsResponse,
    summary="List uploaded documents",
    
)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedDocumentsResponse:
    result = await document_service.list_documents(page=page, page_size=page_size)
    return PaginatedDocumentsResponse(**result)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document by ID",
    
)
async def get_document(document_id: str) -> DocumentResponse:
    result = await document_service.get_document(document_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse(**result)
