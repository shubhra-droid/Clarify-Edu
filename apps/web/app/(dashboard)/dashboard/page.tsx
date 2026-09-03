"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentUpload } from "@/components/modules/upload/document-upload";
import { listDocuments } from "@/services/documents";
import type { UploadedDocument } from "@/types";

import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const refreshDocuments = async () => {
      try {
        const res = await listDocuments();
        if (isMounted) {
          setDocuments(res.items);
        }
      } catch {
        if (isMounted) {
          setDocuments([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void refreshDocuments();

    const intervalId = window.setInterval(() => {
      void refreshDocuments();
    }, 6000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleUploadComplete = (doc: UploadedDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 404) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section aria-labelledby="dashboard-heading">
        <div className="mb-6">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
            Adaptive Learning Engine
          </Badge>
          <h2 id="dashboard-heading" className="text-2xl font-bold tracking-tight text-white">
            Welcome to ClarifyEdu
          </h2>
          <p className="mt-1 text-purple-100">
            Upload a document to generate mind maps, ADHD summaries, quizzes, and
            more — tailored to your learning profile.
          </p>
        </div>

        <DocumentUpload onUploadComplete={handleUploadComplete} />
      </section>

      <section aria-labelledby="recent-docs-heading">
        <Card>
          <CardHeader>
            <CardTitle id="recent-docs-heading">Recent Documents</CardTitle>
            <CardDescription>
              Your uploaded materials and processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading documents…</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents yet. Upload your first study material above.
              </p>
            ) : (
              <ul className="space-y-3" role="list">
                {documents.map((doc) => {
                  const isCompleted = doc.status === "completed";
                  const itemContent = (
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-medium">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            doc.status === "completed"
                              ? "secondary"
                              : "outline"
                          }
                          className={cn(
                            "capitalize",
                            doc.status === "failed" && "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10"
                          )}
                        >
                          {doc.status}
                        </Badge>
                        {isCompleted && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-500 hover:text-red-400 z-10"
                          onClick={(e) => handleDelete(doc.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );

                  return (
                    <li
                      key={doc.id}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        doc.status !== "failed"
                          ? "hover:bg-muted/50 cursor-pointer"
                          : ""
                      )}
                    >
                      {doc.status !== "failed" ? (
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="block w-full"
                        >
                          {itemContent}
                        </Link>
                      ) : (
                        itemContent
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {documents.length > 0 && (
              <Button variant="link" className="mt-4 px-0" asChild>
                <Link href="/dashboard/upload">
                  View all uploads
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
