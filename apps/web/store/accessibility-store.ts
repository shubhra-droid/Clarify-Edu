import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AccessibilityFont,
  AccessibilityPreferences,
  BackgroundTint,
  FocusModeLevel,
  FocusTimerSettings,
  NeuroProfile,
} from "@/types";

export interface AccessibilityState {
  neuroProfile: NeuroProfile;
  focusMode: FocusModeLevel;
  preferences: AccessibilityPreferences;
  focusTimer: FocusTimerSettings;
  focusTimerActive: boolean;
  focusTimerRemainingSeconds: number;
  focusTimerPhase: "work" | "break" | "longBreak" | "idle";

  setNeuroProfile: (profile: NeuroProfile) => void;
  setFocusMode: (mode: FocusModeLevel) => void;
  updatePreferences: (partial: Partial<AccessibilityPreferences>) => void;
  updateFocusTimer: (partial: Partial<FocusTimerSettings>) => void;
  applyPreset: (profile: NeuroProfile) => void;
  toggleReadingRuler: () => void;
  toggleBionicReading: () => void;
  toggleHighContrast: () => void;
  setFocusTimerActive: (active: boolean) => void;
  setFocusTimerRemaining: (seconds: number) => void;
  setFocusTimerPhase: (phase: AccessibilityState["focusTimerPhase"]) => void;
}

const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  font: "default",
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  backgroundTint: "default",
  bionicReading: false,
  highContrast: false,
  reducedMotion: false,
  readingRulerEnabled: false,
};

const DEFAULT_FOCUS_TIMER: FocusTimerSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

const PRESETS: Record<
  NeuroProfile,
  Partial<AccessibilityPreferences> & { focusMode?: FocusModeLevel }
> = {
  adhd: {
    focusMode: "adhd",
    bionicReading: true,
    highContrast: true,
    backgroundTint: "default",
    lineHeight: 1.6,
    readingRulerEnabled: false,
  },
  dyslexia: {
    font: "lexend",
    lineHeight: 1.9,
    letterSpacing: 0.05,
    wordSpacing: 0.12,
    backgroundTint: "cream",
    readingRulerEnabled: true,
    bionicReading: false,
  },
  asd: {
    focusMode: "standard",
    backgroundTint: "mint",
    lineHeight: 1.7,
    highContrast: false,
    readingRulerEnabled: false,
  },
  executive: {
    focusMode: "deep",
    lineHeight: 1.6,
    bionicReading: true,
    backgroundTint: "blue",
  },
  mixed: {
    lineHeight: 1.7,
    backgroundTint: "default",
  },
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      neuroProfile: "mixed",
      focusMode: "standard",
      preferences: DEFAULT_PREFERENCES,
      focusTimer: DEFAULT_FOCUS_TIMER,
      focusTimerActive: false,
      focusTimerRemainingSeconds: DEFAULT_FOCUS_TIMER.workMinutes * 60,
      focusTimerPhase: "idle",

      setNeuroProfile: (profile) => {
        set({ neuroProfile: profile });
        get().applyPreset(profile);
      },

      setFocusMode: (mode) => set({ focusMode: mode }),

      updatePreferences: (partial) =>
        set((state) => ({
          preferences: { ...state.preferences, ...partial },
        })),

      updateFocusTimer: (partial) =>
        set((state) => ({
          focusTimer: { ...state.focusTimer, ...partial },
        })),

      applyPreset: (profile) => {
        const preset = PRESETS[profile];
        set((state) => ({
          focusMode: preset.focusMode ?? state.focusMode,
          preferences: {
            ...state.preferences,
            ...preset,
          },
        }));
      },

      toggleReadingRuler: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            readingRulerEnabled: !state.preferences.readingRulerEnabled,
          },
        })),

      toggleBionicReading: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            bionicReading: !state.preferences.bionicReading,
          },
        })),

      toggleHighContrast: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            highContrast: !state.preferences.highContrast,
          },
        })),

      setFocusTimerActive: (active) => set({ focusTimerActive: active }),

      setFocusTimerRemaining: (seconds) =>
        set({ focusTimerRemainingSeconds: seconds }),

      setFocusTimerPhase: (phase) => set({ focusTimerPhase: phase }),
    }),
    {
      name: "clarify-edu-a11y",
      partialize: (state) => ({
        neuroProfile: state.neuroProfile,
        focusMode: state.focusMode,
        preferences: state.preferences,
        focusTimer: state.focusTimer,
      }),
    }
  )
);

export const BACKGROUND_TINT_MAP: Record<BackgroundTint, string> = {
  default: "210 40% 98%",
  cream: "36 100% 97%",
  mint: "150 40% 96%",
  blue: "210 60% 97%",
};

export function getFontClassName(font: AccessibilityFont): string {
  switch (font) {
    case "lexend":
    case "opendyslexic":
      return "font-dyslexic";
    default:
      return "font-sans";
  }
}
