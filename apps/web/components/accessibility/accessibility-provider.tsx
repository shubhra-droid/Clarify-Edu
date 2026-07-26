"use client";

import { useEffect } from "react";

import {
  BACKGROUND_TINT_MAP,
  getFontClassName,
  useAccessibilityStore,
} from "@/store/accessibility-store";

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { preferences, focusMode } = useAccessibilityStore();

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--a11y-line-height",
      String(preferences.lineHeight)
    );
    root.style.setProperty(
      "--a11y-letter-spacing",
      `${preferences.letterSpacing}em`
    );
    root.style.setProperty(
      "--a11y-word-spacing",
      `${preferences.wordSpacing}em`
    );
    root.style.setProperty(
      "--a11y-bg-tint",
      BACKGROUND_TINT_MAP[preferences.backgroundTint]
    );

    root.classList.toggle("a11y-high-contrast", preferences.highContrast);
    root.classList.toggle("a11y-bionic", preferences.bionicReading);
    root.classList.toggle("dark", focusMode === "deep");
    root.classList.toggle("a11y-adhd-focus", focusMode === "adhd");

    const fontClass = getFontClassName(preferences.font);
    root.classList.remove("font-sans", "font-dyslexic");
    root.classList.add(fontClass);

    if (preferences.reducedMotion) {
      root.style.setProperty("--reduced-motion", "reduce");
    } else {
      root.style.removeProperty("--reduced-motion");
    }
  }, [preferences, focusMode]);

  return <>{children}</>;
}
