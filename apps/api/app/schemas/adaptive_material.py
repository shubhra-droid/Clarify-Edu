"""Adaptive study material schemas — mirrors frontend TypeScript types."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class NeuroProfile(str, Enum):
    ADHD = "adhd"
    DYSLEXIA = "dyslexia"
    ASD = "asd"
    EXECUTIVE = "executive"
    MIXED = "mixed"


class KeyDefinition(BaseModel):
    term: str
    definition: str
    context: str | None = None


class StructuredNote(BaseModel):
    title: str
    content: str
    order: int


class MindMapNode(BaseModel):
    id: str
    label: str
    type: str = Field(default="concept", pattern="^(root|concept|detail|example)$")
    position: dict[str, float]
    data: dict[str, Any] | None = None


class MindMapEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None


class MindMapGraph(BaseModel):
    nodes: list[MindMapNode] = Field(default_factory=list)
    edges: list[MindMapEdge] = Field(default_factory=list)


class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[QuizOption]
    correct_option_id: str
    explanation: str
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")


class Flashcard(BaseModel):
    id: str
    front: str
    back: str
    tags: list[str] | None = None


class TTSWordTimestamp(BaseModel):
    word: str
    start_ms: int
    end_ms: int


class TTSSegment(BaseModel):
    id: str
    text: str
    audio_url: str | None = None
    word_timestamps: list[TTSWordTimestamp] = Field(default_factory=list)


class AdaptiveStudyMaterial(BaseModel):
    """Core AI output schema — structured outputs target for LLM pipeline."""

    id: str
    document_id: str
    title: str
    summary: str
    key_definitions: list[KeyDefinition] = Field(default_factory=list)
    structured_notes: list[StructuredNote] = Field(default_factory=list)
    adhd_bullet_summary: list[str] = Field(default_factory=list)
    mind_map: MindMapGraph = Field(default_factory=MindMapGraph)
    quiz: list[QuizQuestion] = Field(default_factory=list)
    flashcards: list[Flashcard] = Field(default_factory=list)
    tts_script: list[TTSSegment] = Field(default_factory=list)
    neuro_profile: NeuroProfile = NeuroProfile.MIXED
    created_at: datetime
    updated_at: datetime
