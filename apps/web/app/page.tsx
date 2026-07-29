import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-slate-800"
          role="status"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Neuroinclusive Learning Platform</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          ClarifyEdu
        </h1>

        <p className="mb-8 text-lg text-slate-700">
          AI-Powered Adaptive Learning Engine for Neurodiverse Education.
          Transform unstructured content into cognitive formats optimized for
          your learning style.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/login" aria-label="Get started with ClarifyEdu">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
