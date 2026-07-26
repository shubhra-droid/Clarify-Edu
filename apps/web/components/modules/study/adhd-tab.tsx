"use client";

import { useState } from "react";
import { HelpCircle, BrainCircuit, Sparkles, SwitchCamera, Timer } from "lucide-react";
import type { StructuredNote } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FocusTimer } from "@/components/accessibility/focus-timer";
import { useAccessibilityStore } from "@/store/accessibility-store";

interface ADHDTabProps {
  bullets: string[];
  notes: StructuredNote[];
}

export function BionicWord({ word }: { word: string }) {
  // Ignore short words or empty tokens
  if (word.length <= 1) {
    return <span>{word} </span>;
  }
  
  // Calculate mid boundary (~40% of word length)
  const len = word.length;
  const mid = Math.max(1, Math.ceil(len * 0.4));
  const boldPart = word.substring(0, mid);
  const restPart = word.substring(mid);

  return (
    <span>
      <strong className="font-extrabold text-foreground tracking-wide">{boldPart}</strong>
      {restPart}{" "}
    </span>
  );
}

export function BionicText({ text }: { text: string }) {
  const paragraphs = text.split("\n");

  return (
    <div className="space-y-4">
      {paragraphs.map((p, pIdx) => {
        const words = p.split(" ");
        return (
          <p key={pIdx} className="leading-relaxed">
            {words.map((w, wIdx) => (
              <BionicWord key={wIdx} word={w} />
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function ADHDTab({ bullets, notes }: ADHDTabProps) {
  const { preferences, updatePreferences } = useAccessibilityStore();
  const [activeNoteIdx, setActiveNoteIdx] = useState<number>(0);

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* Bullet Summary & Chunked Notes (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Bullets Card */}
        <Card className="border-amber-200 bg-amber-50/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-800 text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              ADHD Spark Summary
            </CardTitle>
            <CardDescription className="text-amber-700/80">
              Bite-sized, high-impact key takeaways. Perfect for fast scanning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bullets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bullets generated.</p>
            ) : (
              <ul className="space-y-2">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="text-sm md:text-base text-foreground/80 flex items-start gap-2.5">
                    <span className="text-amber-500 shrink-0 text-lg select-none leading-none">•</span>
                    <span>
                      {preferences.bionicReading ? (
                        <BionicText text={bullet} />
                      ) : (
                        bullet
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Chunked Notes Reader */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Chunked Reading Panel
              </CardTitle>
              <CardDescription>
                Dense text is divided into individual topics to help reduce overwhelm.
              </CardDescription>
            </div>
            
            {/* Local switch for Bionic Reading */}
            <div className="flex items-center space-x-2 shrink-0 bg-muted/40 p-2 rounded-lg border">
              <Switch
                id="bionic-toggle"
                checked={preferences.bionicReading}
                onCheckedChange={(checked) => updatePreferences({ bionicReading: checked })}
              />
              <Label htmlFor="bionic-toggle" className="text-xs font-semibold cursor-pointer select-none">
                Bionic Bold
              </Label>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground">No content blocks available.</p>
            ) : (
              <div className="space-y-6">
                {/* Selector Buttons */}
                <div className="flex flex-wrap gap-2" role="group" aria-label="Reading chunks navigation">
                  {notes.map((note, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveNoteIdx(idx)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition focus-ring ${
                        activeNoteIdx === idx
                          ? "bg-primary border-primary text-white"
                          : "bg-background hover:bg-muted text-muted-foreground border-border"
                      }`}
                      aria-pressed={activeNoteIdx === idx}
                    >
                      Part {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Selected Note Content */}
                <div className="p-4 rounded-xl border bg-muted/10">
                  <h3 className="font-bold text-lg text-primary mb-3">
                    {notes[activeNoteIdx]?.title}
                  </h3>
                  <div className="text-base leading-relaxed text-foreground/90">
                    {preferences.bionicReading ? (
                      <BionicText text={notes[activeNoteIdx]?.content || ""} />
                    ) : (
                      <p className="whitespace-pre-line">{notes[activeNoteIdx]?.content}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro Focus Widgets (Right Column) */}
      <div className="space-y-6">
        <FocusTimer />
        
        <Card className="border-secondary/20 bg-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Study Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-secondary-foreground/80 leading-relaxed">
            <p>
              🌟 **Chunking Strategy**: Avoid forcing yourself to digest long documents all at once. Focus on one segment button above at a time.
            </p>
            <p>
              ⚡ **Bionic Bold**: Bolds the first few letters of words, letting your eye skip and grasp concepts faster, lowering distractions.
            </p>
            <p>
              🧘 **Timer**: Use the Pomodoro timer above. Study for 25 minutes, then force yourself to take a 5-minute movement break!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
