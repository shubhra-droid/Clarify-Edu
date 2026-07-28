"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDocument, listDocuments } from "@/services/documents";
import type { UploadedDocument } from "@/types";

export default function StudyPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await listDocuments(1, 10);
        setDocuments(response.items);
        if (response.items[0]) {
          setSelectedId(response.items[0].id);
          setSelectedDoc(response.items[0]);
        }
      } catch {
        setDocuments([]);
      }
    };

    void loadDocuments();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const loadSelected = async () => {
      const doc = await getDocument(selectedId);
      setSelectedDoc(doc);
    };

    void loadSelected();
  }, [selectedId]);

  const demoSummary = selectedDoc?.studySummary || "Upload a document to create a structured study summary with key definitions, flashcards, and neuro-inclusive notes.";
  const demoPoints = selectedDoc?.keyPoints?.length ? selectedDoc.keyPoints : [
    { term: "Core concept", definition: "The main idea captured from the document" },
    { term: "Key takeaway", definition: "A short explanation you can revisit quickly" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="border-border/60 bg-slate-900/80 text-slate-100 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Study Workspace
          </div>
          <CardTitle className="text-2xl text-white">Adaptive summaries and study materials</CardTitle>
          <CardDescription className="text-slate-300">
            Review an uploaded document or preview a live demo summary without leaving the study view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/80 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">Document</p>
              <p className="text-sm text-slate-400">Select a file to view its generated study material.</p>
            </div>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              {documents.length === 0 ? (
                <option value="">No documents yet</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.filename}</option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">Study Summary</h3>
              </div>
              <p className="text-sm leading-7 text-slate-300">{demoSummary}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
              <h3 className="mb-3 text-lg font-semibold text-white">Key Points</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {demoPoints.map((point, index) => {
                  const term = typeof point.term === "string" ? point.term : "Key point";
                  const definition = typeof point.definition === "string" ? point.definition : "Details coming soon";

                  return (
                    <li key={`${term}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                      <p className="font-medium text-slate-100">{term}</p>
                      <p className="text-slate-400">{definition}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/dashboard/upload">Upload another document</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/mindmap">Open Mind Map</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
