"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Headphones, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDocument, listDocuments } from "@/services/documents";
import type { UploadedDocument } from "@/types";

type LearnerProfile = "dyslexia" | "autism";

export default function StudyPage() {
  const searchParams = useSearchParams();
  const profile = (searchParams.get("profile") as LearnerProfile | null) ?? "dyslexia";
  const selectedView = searchParams.get("view") ?? "study";
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioRate, setAudioRate] = useState(1);

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

  const profileTheme = useMemo(() => {
    if (profile === "autism") {
      return {
        shell: "border-purple-500/40 bg-[#120824] text-white",
        accent: "text-purple-200",
        panel: "border-purple-500/30 bg-purple-900/40",
        text: "text-slate-100",
        muted: "text-slate-300",
      };
    }

    return {
        shell: "border-purple-500/40 bg-[#170a2b] text-white",
        accent: "text-purple-200",
        panel: "border-purple-500/30 bg-purple-900/40",
        text: "text-slate-100",
        muted: "text-slate-300",
      };
  }, [profile]);

  const handleAudioToggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(demoSummary);
    utterance.lang = "en-US";
    utterance.rate = audioRate;
    utterance.onend = () => setIsAudioPlaying(false);
    utterance.onerror = () => setIsAudioPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsAudioPlaying(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className={`border ${profileTheme.shell} shadow-2xl shadow-purple-950/30`}>
        <CardHeader>
          <div className={`inline-flex w-fit items-center gap-2 rounded-full bg-purple-600/20 px-3 py-1 text-sm font-medium ${profileTheme.accent}`}>
            <Sparkles className="h-4 w-4" />
            {profile === "autism" ? "Calm Study Workspace" : "Dyslexia-Friendly Study Workspace"}
          </div>
          <CardTitle className="text-2xl text-white">Adaptive summaries and study materials</CardTitle>
          <CardDescription className={profileTheme.muted}>
            Review an uploaded document with a profile-tailored layout that emphasizes clarity, structure, or audio support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${profileTheme.panel}`}>
            <div>
              <p className="text-sm font-medium text-white">Document</p>
              <p className={`text-sm ${profileTheme.muted}`}>Select a file to view its generated study material.</p>
            </div>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="rounded-lg border border-purple-400/30 bg-[#140a24] px-3 py-2 text-sm text-slate-100"
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

          {selectedView === "audio" ? (
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <div className="flex items-center gap-2 text-purple-200">
                <Headphones className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">Audio Reader</h3>
              </div>
              <p className={`mt-2 text-sm ${profileTheme.muted}`}>
                Built-in reading controls help support auditory processing and a calmer review flow.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={handleAudioToggle} className="bg-purple-600 text-white hover:bg-purple-500">
                  {isAudioPlaying ? "Pause Audio" : "Play Audio"}
                </Button>
                <Button variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" onClick={() => setAudioRate(0.9)}>
                  0.9x
                </Button>
                <Button variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" onClick={() => setAudioRate(1)}>
                  1.0x
                </Button>
                <Button variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" onClick={() => setAudioRate(1.2)}>
                  1.2x
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <div className="mb-3 flex items-center gap-2 text-purple-200">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">Study Summary</h3>
              </div>
              <p className={`text-sm leading-7 ${profileTheme.text}`} style={profile === "dyslexia" ? { letterSpacing: "0.08em", lineHeight: 1.8 } : undefined}>
                {demoSummary}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <h3 className="mb-3 text-lg font-semibold text-white">Key Points</h3>
              <ul className={`space-y-2 text-sm ${profileTheme.muted}`}>
                {demoPoints.map((point, index) => {
                  const term = typeof point.term === "string" ? point.term : "Key point";
                  const definition = typeof point.definition === "string" ? point.definition : "Details coming soon";

                  return (
                    <li key={`${term}-${index}`} className="rounded-lg border border-purple-400/20 bg-[#140a24] p-2">
                      <p className="font-medium text-slate-100">{term}</p>
                      <p className="text-slate-400">{definition}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-purple-600 text-white hover:bg-purple-500">
              <Link href="/dashboard/upload">Upload another document</Link>
            </Button>
            <Button asChild variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800">
              <Link href="/dashboard/mindmap">Open Mind Map</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
