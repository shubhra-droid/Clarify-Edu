import { apiFetch } from "@/services/api-client";
import type { AdaptiveStudyMaterial, UploadedDocument } from "@/types";
import { getDocument } from "@/services/documents";

function mapAdaptiveMaterial(apiData: any): AdaptiveStudyMaterial {
  return {
    id: apiData.id,
    documentId: apiData.document_id,
    title: apiData.title,
    summary: apiData.summary,
    keyDefinitions: apiData.key_definitions || [],
    structuredNotes: apiData.structured_notes || [],
    adhdBulletSummary: apiData.adhd_bullet_summary || [],
    mindMap: {
      nodes: (apiData.mind_map?.nodes || []).map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: (apiData.mind_map?.edges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    },
    quiz: (apiData.quiz || []).map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      correctOptionId: q.correct_option_id,
      explanation: q.explanation,
      difficulty: q.difficulty,
    })),
    flashcards: apiData.flashcards || [],
    ttsScript: (apiData.tts_script || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      audioUrl: t.audio_url,
      wordTimestamps: (t.word_timestamps || []).map((w: any) => ({
        word: w.word,
        startMs: w.start_ms,
        endMs: w.end_ms,
      })),
    })),
    neuroProfile: apiData.neuro_profile,
    createdAt: apiData.created_at,
    updatedAt: apiData.updated_at,
  };
}

export async function getStudyMaterial(documentId: string): Promise<AdaptiveStudyMaterial> {
  const response = await apiFetch<any>(`/materials/${documentId}`);
  return mapAdaptiveMaterial(response);
}

export async function getDocumentStatus(documentId: string): Promise<UploadedDocument> {
  return getDocument(documentId);
}
