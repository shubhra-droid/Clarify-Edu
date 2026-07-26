import { apiFetch, apiUpload } from "@/services/api-client";
import type { PaginatedResponse, UploadedDocument } from "@/types";

interface DocumentResponse {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: UploadedDocument["status"];
  uploaded_at: string;
  processed_at?: string;
  error_message?: string;
}

function mapDocument(doc: DocumentResponse): UploadedDocument {
  return {
    id: doc.id,
    filename: doc.filename,
    mimeType: doc.mime_type as UploadedDocument["mimeType"],
    sizeBytes: doc.size_bytes,
    status: doc.status,
    uploadedAt: doc.uploaded_at,
    processedAt: doc.processed_at,
    errorMessage: doc.error_message,
  };
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiUpload<DocumentResponse>("/documents/upload", formData);
  return mapDocument(response);
}

export async function listDocuments(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<UploadedDocument>> {
  const response = await apiFetch<{
    items: DocumentResponse[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
  }>(`/documents?page=${page}&page_size=${pageSize}`);

  return {
    items: response.items.map(mapDocument),
    total: response.total,
    page: response.page,
    pageSize: response.page_size,
    hasMore: response.has_more,
  };
}

export async function getDocument(id: string): Promise<UploadedDocument> {
  const response = await apiFetch<DocumentResponse>(`/documents/${id}`);
  return mapDocument(response);
}
