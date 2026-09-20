"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDocumentStatus, getStudyMaterial } from "@/services/materials";
import type { AdaptiveStudyMaterial, UploadedDocument } from "@/types";
import { MaterialDashboard } from "@/components/modules/study/material-dashboard";

const MINDFUL_TIPS = [
  "Take a slow breath in for 4 seconds... hold for 4... exhale for 4... repeat. 🧘",
  "Dyslexia font and background overrides are available in the Accessibility tab on the sidebar. ⚡",
  "A quick physical stretch helps release muscle tension and boosts focus chemistry. 🤸",
  "Your document is being structured into chunked notes to reduce cognitive strain. 🧠",
  "We are mapping your content spatially to build an interactive React Flow mind map. 🕸️",
  "Did you know? Spaced repetition helps cement definitions in long-term memory. 🎯",
];

export default function DocumentStudyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<UploadedDocument | null>(null);
  const [material, setMaterial] = useState<AdaptiveStudyMaterial | null>(null);
  const [status, setStatus] = useState<UploadedDocument["status"]>("pending");
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % MINDFUL_TIPS.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const doc = await getDocumentStatus(params.id);
        setDocument(doc);
        setStatus(doc.status);

        if (doc.status === "completed") {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            setMaterial({
              id: `mat-${params.id}`,
              documentId: params.id,
              title: data.title || doc.filename || "Study Material",
              summary: data.summary || "",
              neuroProfile: "mixed",
              keyDefinitions: data.key_definitions || [],
              structuredNotes: data.structured_notes || [],
              adhdBulletSummary: data.adhd_blocks || [],
              mindMap: {
                nodes: data.nodes || [],
                edges: data.edges || []
              },
              quiz: data.quiz || [],
              flashcards: data.flashcards || [],
              ttsScript: data.tts_script || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            setError("Failed to fetch document material");
          }
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (doc.status === "failed") {
          setError(doc.errorMessage || "Document parsing failed.");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        setError("Failed to connect to study server.");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [params.id]);

  const getStatusText = (currentStatus: UploadedDocument["status"]) => {
    switch (currentStatus) {
      case "pending":
        return "Initializing ingestion pipeline...";
      case "uploading":
        return "Saving raw bytes securely...";
      case "extracting":
        return "Extracting unstructured text blocks...";
      case "processing":
        return "Structuring cognitive notes, flashcards, & mind map...";
      case "completed":
        return "Transformation complete!";
      default:
        return "Processing study content...";
    }
  };

  const currentTip = MINDFUL_TIPS[tipIndex] || "";

  return (
    <>
      {material ? (
        <MaterialDashboard material={material} />
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-12 md:py-24">
          <Card className="w-full text-center bg-slate-950 border-purple-500/30 text-white shadow-2xl">
            <CardContent className="pt-6">
              {error ? (
                <div className="space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <XCircle className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Transformation Failed</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                  </div>
                  <div className="flex gap-4 items-center justify-center mt-2">
                    <Button asChild variant="outline">
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm("Delete this document?")) return;
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/${params.id}`, { method: "DELETE" });
                        router.push("/dashboard");
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 text-white">
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-75" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight">Adapting Your Document</h3>
                    <div className="mx-auto flex max-w-sm justify-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                      <span className="capitalize">{status}</span>
                      <span>•</span>
                      <span>{getStatusText(status)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-500/30 bg-purple-900/40 p-4 text-left">
                    <div className="flex gap-3">
                      <Brain className="h-5 w-5 shrink-0 text-accent" />
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/75">
                          Neuro-Inclusive Tip
                        </h4>
                        <p className="mt-1 text-sm text-purple-100 transition-all duration-300">
                          {currentTip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}