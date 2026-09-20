"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Brain,
  Eye,
  Layers,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdaptiveStudyMaterial } from "@/types";
import { OverviewTab } from "./overview-tab";
import { MindMapTab } from "./mindmap-tab";
import { ADHDTab } from "./adhd-tab";
import { AudioTab } from "./audio-tab";
import { QuizTab } from "./quiz-tab";
import { FlashcardTab } from "./flashcard-tab";
import { useAccessibilityStore } from "@/store/accessibility-store";

interface MaterialDashboardProps {
  material: AdaptiveStudyMaterial;
}

type TabType = "overview" | "mindmap" | "adhd" | "audio" | "quiz" | "flashcards";

export function MaterialDashboard({ material }: MaterialDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { preferences } = useAccessibilityStore();

  const TABS: { id: TabType; label: string; icon: typeof BookOpen }[] = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "mindmap", label: "Mind Map", icon: Brain },
    { id: "adhd", label: "ADHD View", icon: Eye },
    { id: "audio", label: "Audio Reader", icon: Volume2 },
    { id: "quiz", label: "Interactive Quiz", icon: Award },
    { id: "flashcards", label: "Flashcards", icon: Layers },
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-12 bg-slate-950 text-white min-h-screen rounded-2xl p-6 border border-purple-900/50 shadow-2xl">
      {/* Header Info */}
      <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{material.title}</h1>
          <p className="mt-1 line-clamp-1 text-sm text-purple-100">{material.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full uppercase">
            {material.neuroProfile} Profile
          </span>
          <span className="text-xs bg-secondary/15 text-secondary font-semibold px-2 py-1 rounded-full">
            {material.structuredNotes.length} Modules
          </span>
        </div>
      </div>

      {/* Tabs navigation bar */}
      <div
        className="flex flex-wrap gap-1 border-b pb-1 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Study dashboard formats"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`${id}-panel`}
            id={`${id}-tab`}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-all outline-none",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-purple-200 hover:text-white hover:border-purple-300"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 mt-2">
        <div
          id="overview-panel"
          role="tabpanel"
          aria-labelledby="overview-tab"
          hidden={activeTab !== "overview"}
        >
          {activeTab === "overview" && (
            <OverviewTab
              notes={material.structuredNotes}
              definitions={material.keyDefinitions}
            />
          )}
        </div>

        <div
          id="mindmap-panel"
          role="tabpanel"
          aria-labelledby="mindmap-tab"
          hidden={activeTab !== "mindmap"}
        >
          {activeTab === "mindmap" && (
            <MindMapTab mindMap={material.mindMap} />
          )}
        </div>

        <div
          id="adhd-panel"
          role="tabpanel"
          aria-labelledby="adhd-tab"
          hidden={activeTab !== "adhd"}
        >
          {activeTab === "adhd" && (
            <ADHDTab
              bullets={material.adhdBulletSummary}
              notes={material.structuredNotes}
            />
          )}
        </div>

        <div
          id="audio-panel"
          role="tabpanel"
          aria-labelledby="audio-tab"
          hidden={activeTab !== "audio"}
        >
          {activeTab === "audio" && (
            <AudioTab script={material.ttsScript} />
          )}
        </div>

        <div
          id="quiz-panel"
          role="tabpanel"
          aria-labelledby="quiz-tab"
          hidden={activeTab !== "quiz"}
        >
          {activeTab === "quiz" && (
            <QuizTab quiz={material.quiz} />
          )}
        </div>

        <div
          id="flashcards-panel"
          role="tabpanel"
          aria-labelledby="flashcards-tab"
          hidden={activeTab !== "flashcards"}
        >
          {activeTab === "flashcards" && (
            <FlashcardTab cards={material.flashcards} />
          )}
        </div>
      </div>
    </div>
  );
}
