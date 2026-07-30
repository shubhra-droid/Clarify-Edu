"use client";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ReadingRuler } from "@/components/accessibility/reading-ruler";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0 z-30" />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <Navbar title={title} />
        <main
          id="main-content"
          className="flex-1 p-4 text-white md:p-6 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-purple-100 [&_span]:text-purple-100 [&_a]:text-text-secondary"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <ReadingRuler />
    </div>
  );
}
