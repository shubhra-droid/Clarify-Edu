"use client";

import { Menu, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FocusTimer } from "@/components/accessibility/focus-timer";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useAccessibilityStore } from "@/store/accessibility-store";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = "Dashboard" }: NavbarProps) {
  const neuroProfile = useAccessibilityStore((s) => s.neuroProfile);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h1>
        <Badge variant="secondary" className="hidden sm:inline-flex capitalize border-primary/30 bg-primary/15 text-slate-100">
          <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
          {neuroProfile} mode
        </Badge>
      </div>

      <FocusTimer compact />
    </header>
  );
}
