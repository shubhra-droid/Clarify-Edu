"use client";

import { useState } from "react";
import { Award, CheckCircle, HelpCircle, RefreshCw, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuizTabProps {
  quiz: QuizQuestion[];
}

export function QuizTab({ quiz }: QuizTabProps) {
  // Store user's selected option ID for each question ID
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  const handleSelectOption = (questionId: string, optionId: string) => {
    // Prevent changing answer once selected
    if (answers[questionId]) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.forEach((q) => {
      if (answers[q.id] === q.correctOptionId) {
        correctCount += 1;
      }
    });
    setScore(correctCount);
  };

  const resetQuiz = () => {
    setAnswers({});
    setScore(null);
  };

  const allAnswered = quiz.length > 0 && quiz.every((q) => !!answers[q.id]);

  if (quiz.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No quiz questions generated for this document.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* Quiz Questions List (Left Pane) */}
      <div className="lg:col-span-2 space-y-6">
        {quiz.map((q, qIdx) => {
          const selectedOptionId = answers[q.id];
          const isAnswered = !!selectedOptionId;
          const isCorrect = selectedOptionId === q.correctOptionId;

          return (
            <Card key={q.id} className="shadow-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                    Question {qIdx + 1} of {quiz.length}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {q.difficulty}
                  </span>
                </div>
                <CardTitle className="text-base md:text-lg font-semibold text-foreground/90 mt-2 leading-snug">
                  {q.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Options List */}
                <div className="grid gap-2" role="radiogroup" aria-label={`Question ${qIdx + 1}`}>
                  {q.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrectOption = opt.id === q.correctOptionId;

                    let optionStyle = "border-border bg-card hover:bg-muted/30";
                    if (isAnswered) {
                      if (isSelected) {
                        optionStyle = isCorrect
                          ? "border-green-500 bg-green-50/20 text-green-900 font-medium"
                          : "border-destructive bg-destructive/5 text-destructive font-medium";
                      } else if (isCorrectOption) {
                        optionStyle = "border-green-500 bg-green-50/10 text-green-800 font-medium";
                      } else {
                        optionStyle = "border-border bg-muted/20 opacity-60 cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        disabled={isAnswered}
                        role="radio"
                        aria-checked={isSelected}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm transition focus-ring flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <span>{opt.text}</span>
                        {isAnswered && isSelected && (
                          isCorrect ? (
                            <CheckCircle className="h-4.5 w-4.5 text-green-600 shrink-0" />
                          ) : (
                            <XCircle className="h-4.5 w-4.5 text-destructive shrink-0" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                {isAnswered && (
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 text-xs md:text-sm animate-accordion-down">
                    <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4" />
                      Explanation
                    </h4>
                    <p className="text-blue-950/80 leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quiz Result Deck (Right Pane) */}
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5 text-center shadow-sm">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <CardTitle className="text-base font-bold mt-2">Active Assessment</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Complete all questions to calculate your score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {score !== null ? (
              <div className="space-y-4">
                <div className="text-4xl font-extrabold text-primary">
                  {score} / {quiz.length}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {score === quiz.length
                    ? "✨ Outstanding score! You have mastered this study sheet."
                    : score >= quiz.length / 2
                      ? "👍 Good attempt. Read through the explanations to master the rest!"
                      : "📖 Re-read the overview and study segments to improve details memory."}
                </p>
                <Button onClick={resetQuiz} className="w-full flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={calculateScore}
                  disabled={!allAnswered}
                  className="w-full"
                >
                  Grade Quiz
                </Button>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {!allAnswered
                    ? `Remaining: ${quiz.length - Object.keys(answers).length} questions`
                    : "Ready to submit answers!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
