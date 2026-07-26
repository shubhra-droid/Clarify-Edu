"use client";

import {
  Brain,
  Eye,
  Focus,
  Palette,
  Ruler,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useAccessibilityStore,
} from "@/store/accessibility-store";
import type { BackgroundTint, NeuroProfile } from "@/types";
import { cn } from "@/lib/utils";

const NEURO_PROFILES: { value: NeuroProfile; label: string; icon: typeof Brain }[] = [
  { value: "adhd", label: "ADHD", icon: Focus },
  { value: "dyslexia", label: "Dyslexia", icon: Type },
  { value: "asd", label: "ASD", icon: Brain },
  { value: "executive", label: "Executive", icon: Palette },
  { value: "mixed", label: "Mixed", icon: Eye },
];

const BACKGROUND_TINTS: { value: BackgroundTint; label: string; color: string }[] = [
  { value: "default", label: "Default", color: "bg-background" },
  { value: "cream", label: "Warm Cream", color: "bg-surface-cream" },
  { value: "mint", label: "Soft Mint", color: "bg-surface-mint" },
  { value: "blue", label: "Pastel Blue", color: "bg-surface-blue" },
];

interface ModeTogglePanelProps {
  className?: string;
}

export function ModeTogglePanel({ className }: ModeTogglePanelProps) {
  const {
    neuroProfile,
    preferences,
    setNeuroProfile,
    updatePreferences,
  } = useAccessibilityStore();

  return (
    <div
      className={cn("space-y-6", className)}
      role="region"
      aria-label="Accessibility settings"
    >
      <div>
        <h3 className="mb-3 text-sm font-semibold">Learning Profile</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Neuro profile presets">
          {NEURO_PROFILES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={neuroProfile === value ? "default" : "outline"}
              size="sm"
              onClick={() => setNeuroProfile(value)}
              aria-pressed={neuroProfile === value}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bionic-reading" className="flex items-center gap-2">
              Bionic Reading
              <Badge variant="outline" className="text-[10px]">ADHD</Badge>
            </Label>
            <p className="text-xs text-muted-foreground">
              Emphasizes word beginnings for faster scanning
            </p>
          </div>
          <Switch
            id="bionic-reading"
            checked={preferences.bionicReading}
            onCheckedChange={(checked) =>
              updatePreferences({ bionicReading: checked })
            }
            aria-label="Toggle bionic reading mode"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reading-ruler" className="flex items-center gap-2">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              Reading Ruler
            </Label>
            <p className="text-xs text-muted-foreground">
              Horizontal guide follows your cursor
            </p>
          </div>
          <Switch
            id="reading-ruler"
            checked={preferences.readingRulerEnabled}
            onCheckedChange={(checked) =>
              updatePreferences({ readingRulerEnabled: checked })
            }
            aria-label="Toggle reading ruler"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="high-contrast">High Contrast</Label>
            <p className="text-xs text-muted-foreground">
              Increases text and border contrast
            </p>
          </div>
          <Switch
            id="high-contrast"
            checked={preferences.highContrast}
            onCheckedChange={(checked) =>
              updatePreferences({ highContrast: checked })
            }
            aria-label="Toggle high contrast mode"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Dyslexia Font</Label>
        <div className="flex gap-2" role="group" aria-label="Font selection">
          {(["default", "lexend"] as const).map((font) => (
            <Button
              key={font}
              variant={preferences.font === font ? "default" : "outline"}
              size="sm"
              onClick={() => updatePreferences({ font })}
              aria-pressed={preferences.font === font}
            >
              {font === "default" ? "Inter" : "Lexend"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="line-height">Line Height</Label>
          <span className="text-xs text-muted-foreground">
            {preferences.lineHeight.toFixed(1)}
          </span>
        </div>
        <Slider
          id="line-height"
          min={1.2}
          max={2.4}
          step={0.1}
          value={[preferences.lineHeight]}
          onValueChange={([value]) =>
            updatePreferences({ lineHeight: value ?? 1.5 })
          }
          aria-label="Adjust line height"
        />
      </div>

      <div className="space-y-3">
        <Label>Background Tint</Label>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Background tint">
          {BACKGROUND_TINTS.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              className={cn(
                "focus-ring flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition",
                preferences.backgroundTint === value
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => updatePreferences({ backgroundTint: value })}
              aria-pressed={preferences.backgroundTint === value}
            >
              <span className={cn("h-5 w-5 rounded-full border", color)} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
