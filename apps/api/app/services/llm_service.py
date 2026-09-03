import os
import json
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL_NAME = "claude-sonnet-4-5"


async def generate_study_materials(document_text: str, filename: str) -> dict:
    """Returns a dict with title, overview, sections, key_definitions, mind_map_nodes, mind_map_edges."""
    prompt = f"""You are generating study material for the document "{filename}".
Based ONLY on the text below, return a single JSON object (no markdown fences,
no commentary, no text before or after the JSON) with this exact shape:
{{
  "title": "short descriptive title based on the actual content",
  "overview": "2-3 sentence summary of what this document covers",
  "sections": [{{"heading": "...", "body": "..."}}],
  "key_definitions": [{{"term": "...", "definition": "..."}}],
  "mind_map_nodes": [{{"id": "root", "label": "...", "type": "root"}}],
  "mind_map_edges": [{{"source": "root", "target": "concept_1", "label": "contains"}}]
}}

Document text:
---
{document_text[:15000]}
---
"""
    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").removeprefix("json").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Claude returned non-JSON: %s", raw[:500])
        raise ValueError("Failed to parse study material from Claude response")