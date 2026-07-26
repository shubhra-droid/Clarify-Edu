"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </TooltipProvider>
  );
}
