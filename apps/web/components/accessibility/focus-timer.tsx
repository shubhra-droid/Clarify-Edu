"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";

import { useFocusTimer } from "@/hooks/use-focus-timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FocusTimerProps {
  className?: string;
  compact?: boolean;
}

const PHASE_LABELS = {
  work: "Focus",
  break: "Break",
  longBreak: "Long Break",
  idle: "Ready",
} as const;

export function FocusTimer({ className, compact = false }: FocusTimerProps) {
  const { phase, isActive, formattedTime, start, pause, reset } =
    useFocusTimer();

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5",
          className
        )}
        role="timer"
        aria-live="polite"
        aria-label={`Focus timer: ${PHASE_LABELS[phase]}, ${formattedTime} remaining`}
      >
        <Timer className="h-4 w-4 text-accent" aria-hidden="true" />
        <span className="font-mono text-sm font-medium">{formattedTime}</span>
        <Badge variant="accent" className="text-[10px]">
          {PHASE_LABELS[phase]}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={isActive ? pause : start}
          aria-label={isActive ? "Pause focus timer" : "Start focus timer"}
        >
          {isActive ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}
      role="region"
      aria-label="Pomodoro focus timer"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Focus Timer</h3>
        </div>
        <Badge variant="secondary">{PHASE_LABELS[phase]}</Badge>
      </div>

      <p
        className="mb-4 text-center font-mono text-4xl font-bold tracking-wider"
        aria-live="polite"
      >
        {formattedTime}
      </p>

      <div className="flex justify-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={isActive ? pause : start}
          aria-label={isActive ? "Pause timer" : "Start timer"}
        >
          {isActive ? (
            <>
              <Pause className="h-4 w-4" aria-hidden="true" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" />
              Start
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          aria-label="Reset timer"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>
    </div>
  );
}
