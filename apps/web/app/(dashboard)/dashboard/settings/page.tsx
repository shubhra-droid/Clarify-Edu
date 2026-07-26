"use client";

import { FocusTimer } from "@/components/accessibility/focus-timer";
import { ModeTogglePanel } from "@/components/accessibility/mode-toggle-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Accessibility Settings
        </h2>
        <p className="text-muted-foreground">
          Customize ClarifyEdu for your cognitive and sensory preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Neuroinclusive Modes</CardTitle>
            <CardDescription>
              Presets and fine-grained controls for ADHD, Dyslexia, and ASD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModeTogglePanel />
          </CardContent>
        </Card>

        <FocusTimer />
      </div>
    </div>
  );
}
