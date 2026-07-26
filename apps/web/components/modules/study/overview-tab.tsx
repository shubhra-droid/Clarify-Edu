"use client";

import { useState } from "react";
import { BookMarked, HelpCircle, Info } from "lucide-react";
import type { KeyDefinition, StructuredNote } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewTabProps {
  notes: StructuredNote[];
  definitions: KeyDefinition[];
}

export function OverviewTab({ notes, definitions }: OverviewTabProps) {
  const [activeDefinition, setActiveDefinition] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* Structured Notes (Main Left Pane) */}
      <div className="lg:col-span-2 space-y-6">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No structured notes generated for this document.
            </CardContent>
          </Card>
        ) : (
          notes
            .sort((a, b) => a.order - b.order)
            .map((note, index) => (
              <Card key={index} className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <BookMarked className="h-5 w-5" />
                    {note.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm md:text-base leading-relaxed text-foreground/80 whitespace-pre-line">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Key Definitions (Right Pane) */}
      <div className="space-y-6">
        <Card className="border-secondary/20 bg-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-secondary flex items-center gap-2">
              <Info className="h-4 w-4" />
              Key Definitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Click on any term below to highlight its definition and context.
            </p>
          </CardContent>
        </Card>

        {definitions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No terms extracted.
          </p>
        ) : (
          <div className="space-y-3" role="list">
            {definitions.map((def, idx) => {
              const isActive = activeDefinition === def.term;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDefinition(isActive ? null : def.term)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 focus-ring ${
                    isActive
                      ? "border-secondary bg-secondary/10 shadow-sm"
                      : "border-border bg-card hover:border-secondary/40"
                  }`}
                  role="listitem"
                  aria-expanded={isActive}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      {def.term}
                    </span>
                    <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {isActive && (
                    <div className="mt-2 text-xs leading-relaxed space-y-2 animate-accordion-down">
                      <p className="text-foreground/90 font-medium">
                        {def.definition}
                      </p>
                      {def.context && (
                        <p className="text-muted-foreground border-l-2 border-secondary/40 pl-2 italic">
                          Context: {def.context}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
