"use client";

import { Suspense, useState } from "react";
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
  const [loginFlow, setLoginFlow] = useState<null | "student" | "demo">(null);
  const [demoStep, setDemoStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  const finishLogin = (profileId: string) => {
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
              onClick={() => {
                setLoginFlow(profile.id as "student" | "demo");
                setDemoStep(1);
              }}
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

      {/* Modals overlay */}
      {loginFlow === "student" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-border bg-card shadow-2xl">
            <CardHeader>
              <CardTitle>Student Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Alex"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setLoginFlow(null)}>Cancel</Button>
                <Button
                  onClick={() => finishLogin("student")}
                  disabled={!studentName || !studentPassword}
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loginFlow === "demo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to ClarifyEdu</CardTitle>
              <CardDescription>
                {demoStep === 1 && "Step 1: Explore Adaptive Workspaces"}
                {demoStep === 2 && "Step 2: Generate Smart Content"}
                {demoStep === 3 && "Step 3: Ready to Learn"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoStep === 1 && (
                <p className="text-base leading-relaxed text-muted-foreground">
                  ClarifyEdu adapts to different learning profiles, offering specific modes curated for Dyslexia, Autism, and ADHD.
                </p>
              )}
              {demoStep === 2 && (
                <p className="text-base leading-relaxed text-muted-foreground">
                  Upload your documents and let our AI generate specialized mind maps, ADHD-friendly summaries, and text-to-speech audio.
                </p>
              )}
              {demoStep === 3 && (
                <p className="text-base leading-relaxed text-muted-foreground">
                  You are now jumping into a pre-populated demo workspace. Take your time exploring the features!
                </p>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-2">
                  <div className={`h-2 w-8 rounded-full transition-colors ${demoStep >= 1 ? "bg-primary" : "bg-primary/20"}`} />
                  <div className={`h-2 w-8 rounded-full transition-colors ${demoStep >= 2 ? "bg-primary" : "bg-primary/20"}`} />
                  <div className={`h-2 w-8 rounded-full transition-colors ${demoStep >= 3 ? "bg-primary" : "bg-primary/20"}`} />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setLoginFlow(null)}>Skip</Button>
                  {demoStep < 3 ? (
                    <Button onClick={() => setDemoStep(s => s + 1)}>Next</Button>
                  ) : (
                    <Button onClick={() => finishLogin("demo")}>Get Started</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
