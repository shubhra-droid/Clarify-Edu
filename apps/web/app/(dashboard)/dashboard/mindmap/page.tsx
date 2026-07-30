"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brain, Sparkles, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/store/document-store";
import type { UploadedDocument } from "@/types";

type LearnerProfile = "dyslexia" | "autism";

export default function MindMapPage() {
  const { documents, selectedDocumentId, setSelectedDocumentId } = useDocumentStore();
  const searchParams = useSearchParams();
  const profile = (searchParams.get("profile") as LearnerProfile | null) ?? "dyslexia";
  // If no document is selected, auto-select the first one available
  useEffect(() => {
    if (!selectedDocumentId && documents.length > 0) {
      const firstDoc = documents[0];
      if (firstDoc) {
        setSelectedDocumentId(firstDoc.id);
      }
    }
  }, [documents, selectedDocumentId, setSelectedDocumentId]);

  const selectedId = selectedDocumentId ?? "";
  const selectedDoc = documents.find((doc) => doc.id === selectedId) || null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNodes, setFallbackNodes] = useState<any[] | null>(null);
  const [fallbackEdges, setFallbackEdges] = useState<any[] | null>(null);

  useEffect(() => {
    if (selectedDoc && (!selectedDoc.mindMapNodes || selectedDoc.mindMapNodes.length === 0)) {
      setIsLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/generate-mindmap?document_id=${selectedId}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to generate mind map");
          return res.json();
        })
        .then(data => {
          setFallbackNodes(data.nodes);
          setFallbackEdges(data.edges);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      setError(null);
      setIsLoading(false);
      setFallbackNodes(null);
      setFallbackEdges(null);
    }
  }, [selectedDoc, selectedId]);

  const nodes = selectedDoc?.mindMapNodes?.length ? selectedDoc.mindMapNodes : (fallbackNodes || []);
  const edges = selectedDoc?.mindMapEdges?.length ? selectedDoc.mindMapEdges : (fallbackEdges || []);

  const profileTheme = useMemo(() => {
    if (profile === "autism") {
      return {
        shell: "border-purple-500/40 bg-[#120824] text-white",
        panel: "border-purple-500/30 bg-purple-900/40",
        muted: "text-slate-300",
      };
    }

    return {
      shell: "border-purple-500/40 bg-[#170a2b] text-white",
      panel: "border-purple-500/30 bg-purple-900/40",
      muted: "text-slate-300",
    };
  }, [profile]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className={`border ${profileTheme.shell} shadow-2xl shadow-purple-950/30`}>
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-600/20 px-3 py-1 text-sm font-medium text-purple-200">
            <Sparkles className="h-4 w-4" />
            {profile === "autism" ? "Calm Mind Map Workspace" : "Structured Concept Map"}
          </div>
          <CardTitle className="text-2xl text-white">Concept maps and learning pathways</CardTitle>
          <CardDescription className={profileTheme.muted}>
            Browse a generated concept map for the selected document and explore the linked ideas with a calm, high-contrast layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${profileTheme.panel}`}>
            <div>
              <p className="text-sm font-medium text-white">Document</p>
              <p className={`text-sm ${profileTheme.muted}`}>Switch documents to see a different mind map.</p>
            </div>
            <select
              value={selectedId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              className="rounded-lg border border-purple-400/30 bg-[#140a24] px-3 py-2 text-sm text-slate-100"
            >
              {documents.length === 0 ? (
                <option value="" className="bg-purple-950 text-white">No documents yet</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-purple-950 text-white">{doc.filename}</option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <div className="mb-3 flex items-center gap-2 text-purple-200">
                <Brain className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">Interactive Concept Map</h3>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex animate-pulse flex-col gap-3">
                    <div className="h-16 rounded-lg bg-purple-900/40"></div>
                    <div className="h-16 rounded-lg bg-purple-900/40"></div>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-200">
                    <AlertCircle className="mb-2 h-5 w-5" />
                    {error}
                  </div>
                ) : (
                  nodes.map((node) => (
                    <div key={node.id} className="rounded-lg border border-purple-400/20 bg-[#140a24] p-3">
                      <p className="font-medium text-slate-100">{node.label}</p>
                      <p className="text-xs uppercase tracking-wide text-purple-200">{node.type}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <h3 className="mb-3 text-lg font-semibold text-white">Connections</h3>
              <ul className={`space-y-2 text-sm ${profileTheme.muted}`}>
                {isLoading ? (
                  <div className="flex animate-pulse flex-col gap-3">
                    <div className="h-8 rounded-lg bg-purple-900/40"></div>
                    <div className="h-8 rounded-lg bg-purple-900/40"></div>
                  </div>
                ) : error ? null : (
                  edges.map((edge) => (
                    <li key={edge.id} className="rounded-lg border border-purple-400/20 bg-[#140a24] p-2">
                      <span className="font-medium text-slate-100">{edge.source}</span> → <span className="font-medium text-slate-100">{edge.target}</span>
                      {edge.label ? <span className="ml-2 text-purple-200">({edge.label})</span> : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-purple-600 text-white hover:bg-purple-500">
              <Link href="/dashboard/upload">Process a new document</Link>
            </Button>
            <Button asChild variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800">
              <Link href="/dashboard/study">Open Study View</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
