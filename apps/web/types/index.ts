/**
 * ClarifyEdu — Core domain types shared across frontend modules.
 * Mirrors backend Pydantic schemas for AdaptiveStudyMaterial pipeline.
 */

// ---------------------------------------------------------------------------
// Neuroinclusive UI & Accessibility
// ---------------------------------------------------------------------------

export type NeuroProfile = "adhd" | "dyslexia" | "asd" | "executive" | "mixed";

export type AccessibilityFont = "default" | "opendyslexic" | "lexend";

export type BackgroundTint = "default" | "cream" | "mint" | "blue";

export type FocusModeLevel = "standard" | "adhd" | "deep";

export interface AccessibilityPreferences {
  font: AccessibilityFont;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  backgroundTint: BackgroundTint;
  bionicReading: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  readingRulerEnabled: boolean;
}

export interface FocusTimerSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

// ---------------------------------------------------------------------------
// Document Ingestion
// ---------------------------------------------------------------------------

export type DocumentStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "processing"
  | "completed"
  | "failed";

export type SupportedMimeType =
  | "application/pdf"
  | "text/plain"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface UploadedDocument {
  id: string;
  filename: string;
  mimeType: SupportedMimeType;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Adaptive Study Material (AI Output Schema)
// ---------------------------------------------------------------------------

export interface KeyDefinition {
  term: string;
  definition: string;
  context?: string;
}

export interface StructuredNote {
  title: string;
  content: string;
  order: number;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: "root" | "concept" | "detail" | "example";
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface MindMapGraph {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
}

export interface TTSWordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

export interface TTSSegment {
  id: string;
  text: string;
  audioUrl?: string;
  wordTimestamps: TTSWordTimestamp[];
}

export interface AdaptiveStudyMaterial {
  id: string;
  documentId: string;
  title: string;
  summary: string;
  keyDefinitions: KeyDefinition[];
  structuredNotes: StructuredNote[];
  adhdBulletSummary: string[];
  mindMap: MindMapGraph;
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  ttsScript: TTSSegment[];
  neuroProfile: NeuroProfile;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Contracts
// ---------------------------------------------------------------------------

export interface ApiHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    api: "up" | "down";
    database: "up" | "down" | "unknown";
    redis: "up" | "down" | "unknown";
  };
}

export interface ApiErrorResponse {
  detail: string;
  code?: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// User Profile (future auth module)
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  neuroProfile: NeuroProfile;
  accessibility: AccessibilityPreferences;
  focusTimer: FocusTimerSettings;
  createdAt: string;
}
