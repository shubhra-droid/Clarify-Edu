"use client";

import { useCallback, useEffect, useState } from "react";

import { useAccessibilityStore } from "@/store/accessibility-store";
import { cn } from "@/lib/utils";

export function ReadingRuler() {
  const enabled = useAccessibilityStore(
    (s) => s.preferences.readingRulerEnabled
  );
  const [y, setY] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setY(e.clientY);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, handleMouseMove]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] h-10 -translate-y-1/2 bg-secondary/15 mix-blend-multiply dark:mix-blend-screen"
      style={{ top: y }}
      aria-hidden="true"
      role="presentation"
    >
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 h-px bg-secondary/60",
          "shadow-[0_0_8px_rgba(20,184,166,0.4)]"
        )}
      />
    </div>
  );
}
