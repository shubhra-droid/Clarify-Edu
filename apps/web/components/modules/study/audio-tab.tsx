"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, ListMusic } from "lucide-react";
import type { TTSSegment, TTSWordTimestamp } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AudioTabProps {
  script: TTSSegment[];
}

export function AudioTab({ script }: { script: TTSSegment[] }) {
  const [activeSegIdx, setActiveSegIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [muted, setMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeSegment = script[activeSegIdx];

  // Stop playback when switching segments
  const selectSegment = (index: number) => {
    setActiveSegIdx(index);
    setIsPlaying(false);
    setCurrentTimeMs(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Sync state on play/pause clicks
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  // Keep track of audio element time updates
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTimeMs(audioRef.current.currentTime * 1000);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTimeMs(0);
    // Auto-advance to next segment if available
    if (activeSegIdx < script.length - 1) {
      setActiveSegIdx(activeSegIdx + 1);
    }
  };

  // Build full source URL for the backend audio file
  const audioSrc = activeSegment?.audioUrl
    ? `${API_BASE_URL}${activeSegment.audioUrl}`
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* Audio Reader Panel (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Read Aloud Panel
              </CardTitle>
              <CardDescription>
                Synchronized text highlighting guides visual tracking.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Audio element (hidden) */}
            {audioSrc && (
              <audio
                ref={audioRef}
                src={audioSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Speaking highlights display text area */}
            <div className="p-6 rounded-2xl border bg-card min-h-[160px] text-lg leading-relaxed shadow-sm font-medium">
              {(!activeSegment || !activeSegment.wordTimestamps || activeSegment.wordTimestamps.length === 0) ? (
                <p className="text-foreground">{activeSegment?.text}</p>
              ) : (
                <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                  {activeSegment.wordTimestamps.map((w: TTSWordTimestamp, idx: number) => {
                    const isHighlighted =
                      isPlaying &&
                      currentTimeMs >= w.startMs &&
                      currentTimeMs <= w.endMs;

                    return (
                      <span
                        key={idx}
                        className={cn(
                          "transition-all duration-150 px-1 rounded",
                          isHighlighted
                            ? "bg-primary text-white scale-105 font-bold shadow-sm"
                            : "text-foreground/80 hover:text-foreground hover:bg-muted/50 cursor-pointer"
                        )}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = w.startMs / 1000;
                            setCurrentTimeMs(w.startMs);
                          }
                        }}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Control Deck */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-2">
                <Button
                  onClick={togglePlay}
                  disabled={!audioSrc}
                  className="rounded-full h-11 w-11 p-0 shrink-0"
                  aria-label={isPlaying ? "Pause voice reader" : "Play voice reader"}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      setCurrentTimeMs(0);
                    }
                  }}
                  disabled={!audioSrc}
                  className="rounded-full shrink-0"
                  aria-label="Restart segment audio"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMuteToggle}
                  disabled={!audioSrc}
                  className="rounded-full shrink-0"
                  aria-label={muted ? "Unmute audio" : "Mute audio"}
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="flex-1 min-w-[120px] flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground select-none">
                  {((audioRef.current?.currentTime || 0)).toFixed(1)}s
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-primary transition-all"
                    style={{
                      width: `${
                        audioRef.current?.duration
                          ? ((audioRef.current.currentTime / audioRef.current.duration) * 10000) / 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground select-none">
                  {((audioRef.current?.duration || 0)).toFixed(1)}s
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Playlist Segments (Right Column) */}
      <div className="space-y-4">
        <Card className="shadow-sm border-secondary/20">
          <CardHeader className="pb-3 border-b flex flex-row items-center gap-2">
            <ListMusic className="h-5 w-5 text-secondary" />
            <div>
              <CardTitle className="text-sm font-bold text-secondary">Audio Playlists</CardTitle>
              <CardDescription className="text-xs">Segments of the study sheet.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-1.5" role="list">
              {script.map((seg, idx) => {
                const isActive = idx === activeSegIdx;
                return (
                  <button
                    key={seg.id}
                    onClick={() => selectSegment(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs transition focus-ring flex items-center gap-2",
                      isActive
                        ? "bg-secondary text-white font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    role="listitem"
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0 border",
                        isActive ? "border-white bg-white/20" : "border-border bg-muted/40"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate flex-1">{seg.text}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
