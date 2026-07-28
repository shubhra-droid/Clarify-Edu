"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Sparkles, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const profiles = [
  {
    id: "student",
    label: "Login as Student",
    description: "Browse the adaptive study workspace with a polished student experience.",
  },
  {
    id: "demo",
    label: "Login as Demo User",
    description: "Preview the experience with a demo profile and curated learning flow.",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = (profileId: string) => {
    document.cookie = `clarifyedu-auth=${profileId}; path=/; max-age=3600`;
    const redirectTo = searchParams.get("redirect") ?? "/dashboard";
    router.push(redirectTo);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.2),_transparent_45%)] px-6 py-16">
      <Card className="w-full max-w-xl border-border/60 bg-card/90 shadow-2xl shadow-black/20">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Welcome back
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Sign in to ClarifyEdu
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Choose a profile to unlock the dashboard and start learning with your generated study materials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => handleLogin(profile.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/10"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/15 p-2 text-primary">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{profile.label}</p>
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                </div>
              </div>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            Back home
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
