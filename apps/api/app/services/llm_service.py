import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)

MODEL_NAME = "openai/gpt-oss-120b"


async def generate_study_materials(document_text: str, filename: str) -> dict:
    """Returns a dict with title, summary, structured_notes, key_definitions,
    adhd_blocks, nodes, edges, flashcards, quiz, tts_script."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment.")

    client = Groq(api_key=api_key)

    prompt = f"""You are generating study material for the document "{filename}".
Based ONLY on the text below, return a single JSON object. Ensure the JSON conforms to this exact shape.

IMPORTANT:
- "nodes" and "edges" are REQUIRED. Always produce at least one root node and 3-6
  child nodes representing the main topics/categories, even for tabular/list-like
  documents — group related items into meaningful concept nodes.
- "flashcards" are REQUIRED: produce 4-6 front/back revision cards covering the
  most important facts or concepts.
- "quiz" is REQUIRED: produce 3-5 multiple-choice questions, each with 4 options,
  one correct option, and a short explanation.
- "tts_script" is REQUIRED: produce 2-4 short spoken paragraphs (roughly 50-100
  words each) that narrate the document's content aloud in plain, clear language,
  suitable for text-to-speech playback.

{{
  "title": "short descriptive title based on the actual content",
  "summary": "2-3 sentence summary of what this document covers",
  "structured_notes": [{{"title": "...", "content": "...", "order": 1}}],
  "key_definitions": [{{"term": "...", "definition": "...", "context": "..."}}],
  "adhd_blocks": ["bullet 1", "bullet 2"],
  "nodes": [{{"id": "root", "label": "...", "type": "root", "position": {{"x": 0, "y": 0}}}}, {{"id": "concept_1", "label": "...", "type": "concept", "position": {{"x": 150, "y": 150}}}}],
  "edges": [{{"id": "edge_1", "source": "root", "target": "concept_1", "label": "contains"}}],
  "flashcards": [{{"id": "fc1", "front": "...", "back": "...", "tags": ["..."]}}],
  "quiz": [{{"id": "q1", "question": "...", "options": [{{"id": "o1_a", "text": "..."}}, {{"id": "o1_b", "text": "..."}}, {{"id": "o1_c", "text": "..."}}, {{"id": "o1_d", "text": "..."}}], "correct_option_id": "o1_b", "explanation": "..."}}],
  "tts_script": ["paragraph 1 text...", "paragraph 2 text..."]
}}

Document text:
---
{document_text[:15000]}
---
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a specialized study material generator. You must return valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    cleaned = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Groq returned non-JSON: %s", cleaned[:500])
        raise ValueError(f"Failed to parse study material from Groq response: {exc}") from exc