"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";

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
import { useDocumentStore } from "@/store/document-store";

interface DocumentUploadProps {
  onUploadComplete?: (document: UploadedDocument) => void;
}

type LearnerProfile = "dyslexia" | "autism" | "adhd";

const profileOptions: Array<{
  id: LearnerProfile;
  title: string;
  subtitle: string;
  highlights: string[];
}> = [
    {
      id: "dyslexia",
      title: "Dyslexic Profile",
      subtitle: "OpenDyslexic-inspired readability, spaced text, audio-first learning, and supportive study pacing.",
      highlights: ["Letter spacing & bionic reading", "Audio support", "Syllable-friendly layout"],
    },
    {
      id: "adhd",
      title: "ADHD Profile",
      subtitle: "High-impact micro-chunking, visual progress markers, and focus pacing.",
      highlights: ["Micro-chunking", "Visual progress markers", "Focus pacing"],
    },
    {
      id: "autism",
      title: "Autistic Profile",
      subtitle: "Low-sensory structure, calm visual hierarchy, clear bullet summaries, and uncluttered mind maps.",
      highlights: ["Structured sections", "Minimal clutter", "Visual clarity"],
    },
  ];

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
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
    if (!file || !learnerProfile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const backendDoc = await response.json();
      const docId = backendDoc.document_id || backendDoc.id;

      const newDoc: UploadedDocument = {
        id: docId,
        filename: file.name,
        mimeType: "application/pdf",
        sizeBytes: file.size,
        status: backendDoc.status || "processing",
        uploadedAt: new Date().toISOString()
      };

      onUploadComplete?.(newDoc);
      setUploadedDocument(newDoc);
      setFile(null);
      setProcessingDocumentId(newDoc.id);
      useDocumentStore.getState().addDocument(newDoc);

      if (newDoc.status === "completed") {
        setStatusMessage("Upload completed. Your adaptive workspace is ready.");
        router.push(`/dashboard/documents/${newDoc.id}`);
        return;
      }

      setStatusMessage(
        "Upload received and is being processed. Your adaptive study view will appear soon."
      );
      router.push(`/dashboard/documents/${newDoc.id}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectView = (view: "study" | "mindmap" | "audio") => {
    if (!learnerProfile) return;

    const params = new URLSearchParams({ profile: learnerProfile });
    if (view === "audio") {
      params.set("view", "audio");
      router.push(`/dashboard/study?${params.toString()}`);
      return;
    }

    router.push(`/dashboard/${view}?${params.toString()}`);
  };

  useEffect(() => {
    if (!processingDocumentId) return;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/${processingDocumentId}`);
        if (!response.ok) return;

        const doc = await response.json();
        if (doc.status === "completed" || doc.status === "failed") {
          window.clearInterval(intervalId);
          setUploadedDocument((prev) => prev ? { ...prev, status: doc.status } : prev);

          if (doc.status === "failed") {
            setError(doc.error_message || "Document processing failed.");
            setStatusMessage(null);
          } else {
            setStatusMessage("Upload completed. Your adaptive workspace is ready.");
          }
        }
      } catch {
        // Ignore transient polling errors.
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [processingDocumentId]);

  return (
    <Card className="border border-purple-500/40 bg-[#120824] text-white shadow-2xl shadow-purple-950/40">
      <CardHeader>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-600/20 px-3 py-1 text-sm font-medium text-purple-200">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Adaptive Upload Flow
        </div>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5 text-purple-300" aria-hidden="true" />
          Personalize your learner workspace
        </CardTitle>
        <CardDescription className="text-slate-100">
          Choose a learner profile, upload study material, and open a tailored study experience for dyslexia or autism support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {profileOptions.map((profile) => {
            const selected = learnerProfile === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => setLearnerProfile(profile.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  selected
                    ? "border-purple-400 bg-purple-700/40 shadow-lg shadow-purple-950/30"
                    : "border-purple-500/30 bg-purple-900/40 hover:border-purple-400/70"
                )}
              >
                <p className="text-sm font-semibold text-white">{profile.title}</p>
                <p className="mt-1 text-sm text-slate-200">{profile.subtitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.highlights.map((item) => (
                    <span key={item} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-100">
                      {item}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {!learnerProfile ? (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/30 p-3 text-sm text-slate-100">
            Select a profile to unlock the adaptive upload and study tools.
          </div>
        ) : null}

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
            "focus-ring flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-500/40 bg-purple-900/40 p-8 transition-colors",
            isDragging ? "border-purple-300 bg-purple-700/30" : "hover:border-purple-300"
          )}
          aria-label="File drop zone. Press Enter to browse files."
        >
          <Upload className="mb-3 h-10 w-10 text-purple-300" aria-hidden="true" />
          <p className="mb-1 text-sm font-medium text-white">Drag & drop your document here</p>
          <p className="mb-4 text-xs text-slate-100">or click to browse</p>
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
            className="border border-purple-400/60 bg-purple-700/60 text-white hover:bg-purple-600"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Browse Files
          </Button>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-900/40 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-300" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-slate-100">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove selected file">
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-300" role="alert">
            {error}
          </p>
        )}

        <Button
          className="w-full bg-purple-600 font-semibold text-white hover:bg-purple-500"
          disabled={!file || !learnerProfile || isUploading}
          onClick={handleUpload}
          aria-busy={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Upload & Launch Adaptive Workspace
            </>
          )}
        </Button>

        {statusMessage && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/40 p-4">
            <p className="text-sm text-slate-100">{statusMessage}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-500" onClick={() => handleSelectView("study")}>Study</Button>
              <Button size="sm" variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" onClick={() => handleSelectView("mindmap")}>Mind Map</Button>
              <Button size="sm" variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" onClick={() => handleSelectView("audio")}>Audio Reader</Button>
            </div>
            {uploadedDocument ? (
              <div className="mt-3 rounded-xl border border-purple-500/30 bg-[#170a2b] p-3 text-sm text-slate-100">
                <p className="font-semibold text-white">{uploadedDocument.filename}</p>
                <p className="mt-1 text-slate-300">Status: {uploadedDocument.status}</p>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ACCEPTED_FILE_EXTENSIONS.map((ext) => (
            <Badge key={ext} variant="outline" className="border-purple-400/40 bg-purple-900/40 text-slate-100">
              {ext}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}