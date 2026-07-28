"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_SIZE_MB,
} from "@/lib/constants";
import { uploadDocument } from "@/services/documents";
import type { UploadedDocument } from "@/types";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const router = useRouter();

  const validateFile = useCallback((candidate: File): string | null => {
    const extension = `.${candidate.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (
      !ACCEPTED_FILE_EXTENSIONS.includes(
        extension as (typeof ACCEPTED_FILE_EXTENSIONS)[number]
      )
    ) {
      return `Unsupported file type. Accepted: ${ACCEPTED_FILE_EXTENSIONS.join(", ")}`;
    }
    if (candidate.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_UPLOAD_SIZE_MB}MB limit.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (candidate: File) => {
      const validationError = validateFile(candidate);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      setError(null);
      setStatusMessage(null);
      setFile(candidate);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const document = await uploadDocument(file);
      onUploadComplete?.(document);
      setFile(null);
      setProcessingDocumentId(document.id);

      if (document.status === "completed") {
        setStatusMessage("Upload completed. Opening the Study workspace now.");
        router.push("/dashboard/study");
        return;
      }

      setStatusMessage(
        "Upload received and is being processed. We’ll redirect you to the study view as soon as it completes."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!processingDocumentId) return;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/${processingDocumentId}`);
        if (!response.ok) return;

        const doc = await response.json();
        if (doc.status === "completed") {
          window.clearInterval(intervalId);
          router.push("/dashboard/study");
        }
      } catch {
        // Ignore transient polling errors.
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [processingDocumentId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
          Upload Study Material
        </CardTitle>
        <CardDescription>
          PDF, TXT, or DOCX — up to {MAX_UPLOAD_SIZE_MB}MB. Content will be
          transformed into adaptive formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById("file-input")?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "focus-ring flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          aria-label="File drop zone. Press Enter to browse files."
        >
          <Upload
            className="mb-3 h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mb-1 text-sm font-medium">
            Drag & drop your document here
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            or click to browse
          </p>
          <input
            id="file-input"
            type="file"
            accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Browse Files
          </Button>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={!file || isUploading}
          onClick={handleUpload}
          aria-busy={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload & Process
            </>
          )}
        </Button>

        {statusMessage && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <p className="text-sm text-foreground">{statusMessage}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => router.push("/dashboard/study")}>
                Open Study
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/mindmap")}>
                Open Mind Map
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ACCEPTED_FILE_EXTENSIONS.map((ext) => (
            <Badge key={ext} variant="outline">
              {ext}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
