"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Headphones, Sparkles, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/store/document-store";
import type { UploadedDocument } from "@/types";

type LearnerProfile = "dyslexia" | "autism";

export default function StudyPage() {
  const searchParams = useSearchParams();
  const profile = (searchParams.get("profile") as LearnerProfile | null) ?? "dyslexia";
  const selectedView = searchParams.get("view") ?? "study";

  const { documents, selectedDocumentId, setSelectedDocumentId } = useDocumentStore();
  const [playbackState, setPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [audioRate, setAudioRate] = useState(1);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
  const [fallbackSummary, setFallbackSummary] = useState<string | null>(null);
  const [fallbackPoints, setFallbackPoints] = useState<any[] | null>(null);

  useEffect(() => {
    if (selectedDoc && (!selectedDoc.studySummary || !selectedDoc.keyPoints || selectedDoc.keyPoints.length === 0)) {
      setIsLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/generate-studyplan?document_id=${selectedId}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to generate study plan");
          return res.json();
        })
        .then(data => {
          if (data.outline && data.outline[0]) setFallbackSummary(data.outline[0].content);
          setFallbackPoints(data.key_points);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      setError(null);
      setIsLoading(false);
      setFallbackSummary(null);
      setFallbackPoints(null);
    }
  }, [selectedDoc, selectedId]);

  const demoSummary = selectedDoc?.studySummary || fallbackSummary || "Upload a document to create a structured study summary with key definitions, flashcards, and neuro-inclusive notes.";
  const demoPoints = selectedDoc?.keyPoints?.length ? selectedDoc.keyPoints : (fallbackPoints ?? [
    { term: "Core concept", definition: "The main idea captured from the document" },
    { term: "Key takeaway", definition: "A short explanation you can revisit quickly" }
  ]);

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

  const handlePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playbackState === "paused") {
      window.speechSynthesis.resume();
      setPlaybackState("playing");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(demoSummary);
    utterance.lang = "en-US";
    utterance.rate = audioRate;
    utterance.onend = () => setPlaybackState("stopped");
    utterance.onerror = () => setPlaybackState("stopped");
    window.speechSynthesis.speak(utterance);
    setPlaybackState("playing");
  };

  const handlePause = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setPlaybackState("paused");
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPlaybackState("stopped");
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
                {playbackState !== "playing" ? (
                  <Button onClick={handlePlay} className="bg-purple-600 text-white hover:bg-purple-500">
                    {playbackState === "paused" ? "Resume" : "Play Audio"}
                  </Button>
                ) : (
                  <Button onClick={handlePause} className="bg-purple-600 text-white hover:bg-purple-500">
                    Pause
                  </Button>
                )}
                <Button onClick={handleStop} variant="outline" className="border-purple-400/60 text-white hover:bg-purple-800" disabled={playbackState === "stopped"}>
                  Stop
                </Button>

                <div className="ml-4 flex items-center gap-1">
                  <span className="text-xs text-purple-300">Speed:</span>
                  <Button variant="outline" size="sm" className={audioRate === 1 ? "bg-purple-800 text-white" : "border-purple-400/60 text-white hover:bg-purple-800"} onClick={() => { setAudioRate(1); if (playbackState === "playing") handleStop(); }}>
                    1x
                  </Button>
                  <Button variant="outline" size="sm" className={audioRate === 1.25 ? "bg-purple-800 text-white" : "border-purple-400/60 text-white hover:bg-purple-800"} onClick={() => { setAudioRate(1.25); if (playbackState === "playing") handleStop(); }}>
                    1.25x
                  </Button>
                  <Button variant="outline" size="sm" className={audioRate === 1.5 ? "bg-purple-800 text-white" : "border-purple-400/60 text-white hover:bg-purple-800"} onClick={() => { setAudioRate(1.5); if (playbackState === "playing") handleStop(); }}>
                    1.5x
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <div className="mb-3 flex items-center gap-2 text-purple-200">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold text-white">Study Summary</h3>
              </div>
              {isLoading ? (
                <div className="flex animate-pulse flex-col gap-3">
                  <div className="h-24 rounded-lg bg-purple-900/40"></div>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-200">
                  <AlertCircle className="mb-2 h-5 w-5" />
                  {error}
                </div>
              ) : (
                <p className={`text-sm leading-7 ${profileTheme.text}`} style={profile === "dyslexia" ? { letterSpacing: "0.08em", lineHeight: 1.8 } : undefined}>
                  {demoSummary}
                </p>
              )}
            </div>
            <div className={`rounded-2xl border p-4 ${profileTheme.panel}`}>
              <h3 className="mb-3 text-lg font-semibold text-white">Key Points</h3>
              <ul className={`space-y-2 text-sm ${profileTheme.muted}`}>
                {isLoading ? (
                  <div className="flex animate-pulse flex-col gap-3">
                    <div className="h-16 rounded-lg bg-purple-900/40"></div>
                    <div className="h-16 rounded-lg bg-purple-900/40"></div>
                  </div>
                ) : error ? null : demoPoints.length === 0 ? (
                  <p className="text-purple-200">No key points mapped yet.</p>
                ) : (
                  demoPoints.map((point, index) => {
                    const term = point.term || "Key point";
                    const definition = point.definition || "Details coming soon";

                    return (
                      <li key={`${term}-${index}`} className="rounded-lg border border-purple-400/20 bg-[#140a24] p-2">
                        <p className="font-medium text-slate-100">{term}</p>
                        <p className="text-purple-200">{definition}</p>
                      </li>
                    );
                  }))}
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
