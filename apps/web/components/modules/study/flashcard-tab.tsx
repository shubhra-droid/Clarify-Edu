"use client";

import { useState } from "react";
import { BookOpen, Check, HelpCircle, Layers, RefreshCw, X } from "lucide-react";
import type { Flashcard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlashcardTabProps {
  cards: Flashcard[];
}

export function FlashcardTab({ cards }: FlashcardTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewedCount, setReviewedCount] = useState(0);

  const activeCard = cards[currentIndex];

  if (!activeCard) {
    return null;
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMaster = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    advanceCard();
  };

  const handleReview = () => {
    advanceCard();
  };

  const advanceCard = () => {
    setIsFlipped(false);
    setReviewedCount((prev) => prev + 1);
    
    // Find next un-mastered card
    let nextIdx = (currentIndex + 1) % cards.length;
    let iterations = 0;
    
    while (masteredIds.has(cards[nextIdx]?.id || "") && iterations < cards.length) {
      nextIdx = (nextIdx + 1) % cards.length;
      iterations += 1;
    }

    if (iterations < cards.length) {
      setTimeout(() => {
        setCurrentIndex(nextIdx);
      }, 200);
    }
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
    setReviewedCount(0);
  };

  const isCompleted = cards.length > 0 && masteredIds.size === cards.length;

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No flashcards generated for this document.
        </CardContent>
      </Card>
    );
  }

  // 3D Card Inline styles
  const containerStyle = {
    perspective: "1000px",
    height: "280px",
  };

  const cardInnerStyle = {
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
    transformStyle: "preserve-3d" as const,
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    height: "100%",
    width: "100%",
    position: "relative" as const,
  };

  const cardFaceStyle = {
    backfaceVisibility: "hidden" as const,
    position: "absolute" as const,
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
  };

  const cardBackStyle = {
    ...cardFaceStyle,
    transform: "rotateY(180deg)",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* 3D Flashcard Deck Pane (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        {isCompleted ? (
          <Card className="text-center py-12 border-green-200 bg-green-50/10 shadow-sm">
            <CardContent className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-green-900">Deck Mastered!</h3>
                <p className="text-sm text-green-800/80 max-w-sm mx-auto">
                  You have successfully memorized and mastered all {cards.length} revision cards!
                </p>
              </div>
              <Button onClick={resetDeck} variant="outline" className="flex items-center gap-2 mx-auto">
                <RefreshCw className="h-4 w-4" />
                Reset Deck
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Card Frame */}
            <div style={containerStyle} className="w-full relative">
              <div style={cardInnerStyle} className="cursor-pointer select-none shadow-md rounded-2xl">
                {/* FRONT FACE */}
                <div
                  style={cardFaceStyle}
                  onClick={handleFlip}
                  className="rounded-2xl border-2 bg-card p-6 flex flex-col justify-between border-primary/20 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    <span>Card {currentIndex + 1} of {cards.length}</span>
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center text-center px-4 py-8">
                    <p className="text-base md:text-xl font-semibold leading-relaxed text-foreground">
                      {activeCard.front}
                    </p>
                  </div>
                  
                  <div className="text-center text-xs text-muted-foreground/60 italic">
                    Click card to flip
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  style={cardBackStyle}
                  onClick={handleFlip}
                  className="rounded-2xl border-2 bg-card p-6 flex flex-col justify-between border-secondary/20 bg-secondary/5 hover:border-secondary/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-secondary uppercase font-bold tracking-wider">
                    <span>Active Recall Solution</span>
                    <BookOpen className="h-4 w-4 text-secondary" />
                  </div>

                  <div className="flex-1 flex items-center justify-center text-center px-4 py-8">
                    <p className="text-sm md:text-lg font-medium leading-relaxed text-secondary-foreground">
                      {activeCard.back}
                    </p>
                  </div>

                  <div className="text-center text-xs text-secondary/60 italic">
                    Click to flip back
                  </div>
                </div>
              </div>
            </div>

            {/* Score Action deck */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleReview}
                className="w-1/2 border-destructive/20 text-destructive hover:bg-destructive/5 flex items-center gap-2 rounded-xl"
              >
                <X className="h-5 w-5" />
                Review Again
              </Button>
              <Button
                size="lg"
                onClick={() => handleMaster(activeCard.id)}
                className="w-1/2 bg-green-600 hover:bg-green-700 flex items-center gap-2 rounded-xl"
              >
                <Check className="h-5 w-5" />
                Mastered
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Progress & Deck Status (Right Column) */}
      <div className="space-y-6">
        <Card className="border-secondary/20 bg-secondary/5 shadow-sm">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Layers className="h-6 w-6" />
            </div>
            <CardTitle className="text-base font-bold mt-2 text-center">Spaced Repetition</CardTitle>
            <CardDescription className="text-xs text-center">
              Strengthen retrieval pathways by rating your active recall.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mastered percentage */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Deck Mastery</span>
                <span>
                  {Math.round((masteredIds.size / cards.length) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-secondary transition-all"
                  style={{ width: `${(masteredIds.size / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-lg font-bold text-foreground">
                  {masteredIds.size}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Mastered</div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-lg font-bold text-foreground">
                  {cards.length - masteredIds.size}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Remaining</div>
              </div>
            </div>

            <Button onClick={resetDeck} variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground">
              Reset Deck Progress
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
