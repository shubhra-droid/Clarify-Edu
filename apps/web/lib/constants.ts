export const APP_NAME = "ClarifyEdu";
export const APP_TAGLINE =
  "AI-Powered Adaptive Learning Engine for Neurodiverse Education";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const API_V1_PREFIX = "/api/v1";

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ACCEPTED_FILE_EXTENSIONS = [".pdf", ".txt", ".docx"] as const;

export const MAX_UPLOAD_SIZE_MB = 25;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const DESIGN_TOKENS = {
  primary: "#4F46E5",
  secondary: "#14B8A6",
  accent: "#F59E0B",
  backgroundLight: "#F8FAFC",
  backgroundDark: "#0F172A",
} as const;
