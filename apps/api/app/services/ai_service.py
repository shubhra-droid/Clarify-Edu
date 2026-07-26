"""AI Orchestration service — uses OpenAI Structured Outputs with robust mock fallbacks."""

import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from openai import OpenAI
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas.adaptive_material import (
    AdaptiveStudyMaterial,
    Flashcard,
    KeyDefinition,
    MindMapEdge,
    MindMapGraph,
    MindMapNode,
    NeuroProfile,
    QuizOption,
    QuizQuestion,
    StructuredNote,
    TTSSegment,
)

logger = logging.getLogger(__name__)


# Schema for structured outputs request to OpenAI
class AIStudyMaterialPayload(BaseModel):
    title: str = Field(description="Descriptive title of the study material")
    summary: str = Field(description="A clean, concise overview of the core topics")
    key_definitions: list[KeyDefinition] = Field(
        description="List of key terms, definitions, and context"
    )
    structured_notes: list[StructuredNote] = Field(
        description="Section-by-section breakdown of the material with titles, content, and orders"
    )
    adhd_bullet_summary: list[str] = Field(
        description="Extremely concise, chunked, high-impact bullet points for ADHD learners"
    )
    mind_map_nodes: list[MindMapNode] = Field(
        description="Nodes for React Flow. Use concept, detail, or example as types. Coordinate positions must span nicely (e.g. root at (250, 0), concepts at (100, 150), details at (200, 300))."
    )
    mind_map_edges: list[MindMapEdge] = Field(
        description="Edges linking nodes by source and target IDs"
    )
    quiz: list[QuizQuestion] = Field(
        description="List of multiple-choice questions with options, correct option ID, and explanation"
    )
    flashcards: list[Flashcard] = Field(
        description="List of front/back revision flashcards"
    )
    tts_script: list[str] = Field(
        description="List of short spoken paragraphs (around 50-100 words each) suitable for reading aloud"
    )


class AIService:
    def __init__(self) -> None:
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    async def generate_material(
        self, document_id: str, filename: str, content: str
    ) -> AdaptiveStudyMaterial:
        """Generate AdaptiveStudyMaterial using OpenAI or fallback mock."""
        logger.info("Generating study material for document ID: %s", document_id)

        # Prepare base fields
        now = datetime.now(timezone.utc)
        material_id = str(uuid4())

        # If API key is set, call OpenAI
        if self.client:
            try:
                material_data = await self._call_openai(filename, content)
                return self._create_material_from_payload(
                    material_id, document_id, material_data, now
                )
            except Exception as exc:
                logger.error(
                    "OpenAI generation failed: %s. Falling back to mock generator.",
                    exc,
                )

        # Fallback Mock Generation
        material_data = self._generate_mock_payload(filename, content)
        return self._create_material_from_payload(
            material_id, document_id, material_data, now
        )

    async def _call_openai(self, filename: str, content: str) -> AIStudyMaterialPayload:
        """Call OpenAI with Structured Outputs."""
        truncated_content = content[:15000]  # Prevent token overflow

        prompt = f"""
You are a expert neurodiverse learning assistant. Reshape the following educational content from the file '{filename}' into adaptive formats.
Target ADHD, Dyslexia, ASD, and Executive Dysfunction needs:
- Provide structured summary notes.
- Define important key terms.
- Create an ADHD summary with bullet points.
- Generate a React Flow mind map layout. Position the root node at (250, 0). Distribute child nodes cleanly below/around it (e.g. concepts at (100, 150), (400, 150), details at (0, 300), (200, 300) etc) to avoid overlap.
- Compile a relevant quiz of 3-5 multiple-choice questions.
- Write revision flashcards.
- Provide a sequence of text segments to be read aloud (tts_script).

EDUCATIONAL TEXT CONTENT:
\"\"\"
{truncated_content}
\"\"\"
"""

        completion = self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior accessibility specialist and education researcher. You format document summaries into strict JSON structures optimized for neurodivergent students.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format=AIStudyMaterialPayload,
        )

        parsed_response = completion.choices[0].message.parsed
        if not parsed_response:
            raise ValueError("OpenAI returned an empty response")
        return parsed_response

    def _create_material_from_payload(
        self,
        material_id: str,
        document_id: str,
        payload: AIStudyMaterialPayload,
        timestamp: datetime,
    ) -> AdaptiveStudyMaterial:
        # Convert simple list[str] of tts_script into list[TTSSegment]
        tts_segments = []
        for i, text in enumerate(payload.tts_script):
            tts_segments.append(
                TTSSegment(
                    id=f"tts-seg-{i}",
                    text=text,
                    audio_url=None,
                    word_timestamps=[],
                )
            )

        mind_map_graph = MindMapGraph(
            nodes=payload.mind_map_nodes,
            edges=payload.mind_map_edges,
        )

        return AdaptiveStudyMaterial(
            id=material_id,
            document_id=document_id,
            title=payload.title,
            summary=payload.summary,
            key_definitions=payload.key_definitions,
            structured_notes=payload.structured_notes,
            adhd_bullet_summary=payload.adhd_bullet_summary,
            mind_map=mind_map_graph,
            quiz=payload.quiz,
            flashcards=payload.flashcards,
            tts_script=tts_segments,
            neuro_profile=NeuroProfile.MIXED,
            created_at=timestamp,
            updated_at=timestamp,
        )

    def _generate_mock_payload(self, filename: str, content: str) -> AIStudyMaterialPayload:
        """Create high-quality, content-aware mock adaptive study content."""
        logger.info("Generating mock adaptive material for %s", filename)

        # Detect topic keywords in content
        content_lower = content.lower()
        topic = "General Knowledge"
        details_context = "this study document"

        if "algorithm" in content_lower or "computer" in content_lower or "code" in content_lower:
            topic = "Computer Science & Algorithms"
            details_context = "computational models and algorithmic logic"
        elif "cell" in content_lower or "dna" in content_lower or "organism" in content_lower:
            topic = "Cellular Biology"
            details_context = "biological systems and cellular processes"
        elif "history" in content_lower or "war" in content_lower or "century" in content_lower:
            topic = "World History & Culture"
            details_context = "historical timelines and cultural events"
        elif "market" in content_lower or "economy" in content_lower or "finance" in content_lower:
            topic = "Macroeconomics & Finance"
            details_context = "economic policies, supply-demand, and market kinetics"

        # Mock structured output data
        title = f"Adaptive Guide to {topic}"
        summary = (
            f"This study guide focuses on the fundamental concepts of {topic} extracted from "
            f"{filename}. It breaks down complex, dense details into bite-sized, accessible summaries "
            f"optimized for executive function and ADHD focus styles."
        )

        # 1. Definitions
        definitions = [
            KeyDefinition(
                term="Primary Element",
                definition="The core foundational block of the study topic.",
                context="Understanding this concept is crucial for the rest of the material.",
            ),
            KeyDefinition(
                term="Syntactic Structure",
                definition="The formal organization rules and relationships defining how items combine.",
                context="Relates directly to system organization and rules.",
            ),
            KeyDefinition(
                term="Adaptive feedback",
                definition="A closed loop mechanism where output modifies subsequent input criteria.",
                context="Used heavily in cognitive learning science.",
            ),
        ]

        # 2. Structured Notes
        notes = [
            StructuredNote(
                title="1. Core Foundations",
                content=(
                    f"Every major concept in {topic} rests on establishing its primary elements. "
                    "By chunking these elements, we reduce the cognitive load, allowing the working "
                    "memory to map connections without experiencing information overload."
                ),
                order=1,
            ),
            StructuredNote(
                title="2. Operational Rules",
                content=(
                    f"Operational parameters dictate how separate nodes interact within {details_context}. "
                    "Standard processes show that simple constraints prevent chaos and create "
                    "reusable patterns in complex workflows."
                ),
                order=2,
            ),
            StructuredNote(
                title="3. Practical Application",
                content=(
                    "Applying these concepts involves creating feedback loops. Through active recall, "
                    "spaced repetition, and cross-modal testing, information transitions from temporary "
                    "sensory buffers to long-term synaptic consolidation."
                ),
                order=3,
            ),
        ]

        # 3. ADHD summary
        adhd_bullets = [
            "🧠 **Main Concept**: Reduces complex topics into chunked nodes.",
            "⚡ **Action Pattern**: Follow simple rules rather than over-analyzing.",
            "⏱️ **Focus Priority**: Break reading into 25-minute Pomodoro sessions.",
            "🎯 **Core Takeaway**: Use visual maps to connect terms and structures.",
        ]

        # 4. Mind map
        nodes = [
            MindMapNode(
                id="root",
                label=topic,
                type="root",
                position={"x": 250, "y": 20},
            ),
            MindMapNode(
                id="concept_1",
                label="Core Foundations",
                type="concept",
                position={"x": 100, "y": 150},
            ),
            MindMapNode(
                id="concept_2",
                label="Operational Rules",
                type="concept",
                position={"x": 400, "y": 150},
            ),
            MindMapNode(
                id="detail_1",
                label="Primary Elements",
                type="detail",
                position={"x": 20, "y": 280},
            ),
            MindMapNode(
                id="detail_2",
                label="Feedback Loops",
                type="detail",
                position={"x": 180, "y": 280},
            ),
            MindMapNode(
                id="example_1",
                label="Workflow Patterns",
                type="example",
                position={"x": 400, "y": 280},
            ),
        ]

        edges = [
            MindMapEdge(id="e_r_c1", source="root", target="concept_1", label="contains"),
            MindMapEdge(id="e_r_c2", source="root", target="concept_2", label="governs"),
            MindMapEdge(id="e_c1_d1", source="concept_1", target="detail_1", label="includes"),
            MindMapEdge(id="e_c1_d2", source="concept_1", target="detail_2", label="benefits from"),
            MindMapEdge(id="e_c2_ex1", source="concept_2", target="example_1", label="demonstrates"),
        ]

        # 5. Quiz
        quiz = [
            QuizQuestion(
                id="q1",
                question=f"What is the primary benefit of mapping concepts in {topic}?",
                options=[
                    QuizOption(id="o1_a", text="To increase reading speed instantly"),
                    QuizOption(id="o1_b", text="To reduce working memory cognitive load"),
                    QuizOption(id="o1_c", text="To memorize paragraphs word-for-word"),
                    QuizOption(id="o1_d", text="To avoid writing summaries"),
                ],
                correct_option_id="o1_b",
                explanation="Concept mapping reduces cognitive load by establishing spatial structures and clear links, saving working memory capacity.",
                difficulty="easy",
            ),
            QuizQuestion(
                id="q2",
                question="What role do operational parameters play?",
                options=[
                    QuizOption(id="o2_a", text="They introduce confusion in simple structures"),
                    QuizOption(id="o2_b", text="They dictate how nodes interact and create reusable patterns"),
                    QuizOption(id="o2_c", text="They replace primary elements entirely"),
                    QuizOption(id="o2_d", text="They prevent any modifications to the system"),
                ],
                correct_option_id="o2_b",
                explanation="Operational rules set constraints that govern interaction between nodes, forming readable, structured patterns.",
                difficulty="medium",
            ),
        ]

        # 6. Flashcards
        cards = [
            Flashcard(
                id="fc1",
                front="What is the main goal of ClarifyEdu's ADHD Focus Mode?",
                back="To present high-impact, chunked summaries and bionic reading to prevent distraction and information overload.",
                tags=["Accessibility", "ADHD"],
            ),
            Flashcard(
                id="fc2",
                front="Why do dyslexia-friendly modes utilize soft background tints like cream or mint?",
                back="To reduce visual glare and improve text contrast and readability without triggering sensory fatigue.",
                tags=["Dyslexia", "A11y"],
            ),
            Flashcard(
                id="fc3",
                front="Explain the function of a 'Reading Ruler'.",
                back="A horizontal guided highlight that follows the cursor, helping readers track lines without skipping text.",
                tags=["Dyslexia", "Focus"],
            ),
        ]

        # 7. TTS Script
        tts = [
            f"Welcome to the study guide on {topic}. In this lesson, we cover the core structures that build the subject.",
            "First, let us examine the fundamental blocks. By categorizing each concept into clean, spatial hierarchies, we help reduce cognitive strain.",
            "Next, we examine operational rules. These constraints keep structures predictable, leading to active recall and better study patterns.",
        ]

        return AIStudyMaterialPayload(
            title=title,
            summary=summary,
            key_definitions=definitions,
            structured_notes=notes,
            adhd_bullet_summary=adhd_bullets,
            mind_map_nodes=nodes,
            mind_map_edges=edges,
            quiz=quiz,
            flashcards=cards,
            tts_script=tts,
        )


ai_service = AIService()
