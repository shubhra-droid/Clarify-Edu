"use client";

import { useEffect, useRef } from "react";

import { useAccessibilityStore } from "@/store/accessibility-store";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useFocusTimer() {
  const {
    focusTimer,
    focusTimerActive,
    focusTimerRemainingSeconds,
    focusTimerPhase,
    setFocusTimerActive,
    setFocusTimerRemaining,
    setFocusTimerPhase,
  } = useAccessibilityStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionsCompletedRef = useRef(0);

  useEffect(() => {
    if (!focusTimerActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const current = useAccessibilityStore.getState().focusTimerRemainingSeconds;
      if (current <= 1) {
        const state = useAccessibilityStore.getState();
        const { workMinutes, breakMinutes, longBreakMinutes, sessionsBeforeLongBreak } =
          state.focusTimer;

        if (state.focusTimerPhase === "work") {
          sessionsCompletedRef.current += 1;
          const isLongBreak =
            sessionsCompletedRef.current % sessionsBeforeLongBreak === 0;
          setFocusTimerPhase(isLongBreak ? "longBreak" : "break");
          setFocusTimerRemaining(
            (isLongBreak ? longBreakMinutes : breakMinutes) * 60
          );
        } else {
          setFocusTimerPhase("work");
          setFocusTimerRemaining(workMinutes * 60);
        }
        return;
      }
      setFocusTimerRemaining(current - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    focusTimerActive,
    setFocusTimerPhase,
    setFocusTimerRemaining,
  ]);

  const start = () => {
    if (focusTimerPhase === "idle") {
      setFocusTimerPhase("work");
      setFocusTimerRemaining(focusTimer.workMinutes * 60);
    }
    setFocusTimerActive(true);
  };

  const pause = () => setFocusTimerActive(false);

  const reset = () => {
    setFocusTimerActive(false);
    setFocusTimerPhase("idle");
    setFocusTimerRemaining(focusTimer.workMinutes * 60);
    sessionsCompletedRef.current = 0;
  };

  return {
    phase: focusTimerPhase,
    isActive: focusTimerActive,
    remainingSeconds: focusTimerRemainingSeconds,
    formattedTime: formatTime(focusTimerRemainingSeconds),
    start,
    pause,
    reset,
  };
}
