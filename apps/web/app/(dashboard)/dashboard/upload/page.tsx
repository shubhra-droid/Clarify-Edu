"use client";

import { DocumentUpload } from "@/components/modules/upload/document-upload";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload</h2>
        <p className="text-muted-foreground">
          Add PDF, TXT, or DOCX files to begin adaptive transformation.
        </p>
      </div>
      <DocumentUpload />
    </div>
  );
}
