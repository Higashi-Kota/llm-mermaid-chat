"""Node for detecting language and diagram type from prompt."""

from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING

from mermaid_llm.config import settings
from mermaid_llm.graph.state import DiagramState, DiagramType, Language
from mermaid_llm.llm import LLMClient, create_prompt_template

if TYPE_CHECKING:
    from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

DETECT_SYSTEM_MESSAGE = """Analyze the user's prompt and determine:
1. Language: "ja" (Japanese), "en" (English), or "other"
2. Diagram type: one of "flowchart", "sequence", "gantt", \
"class", "er", "state", "journey"

Rules for diagram type detection:
- flowchart: process flows, decision trees, workflows
- sequence: interactions between entities over time
- gantt: project timelines, schedules
- class: class diagrams, object relationships
- er: entity-relationship diagrams, database schemas
- state: state machines, state transitions
- journey: user journeys, experience maps

Respond ONLY with valid JSON: {"language": "...", "diagram_type": "..."}"""

_detect_prompt: ChatPromptTemplate | None = None


def _get_detect_prompt() -> ChatPromptTemplate:
    """Get or create the detection prompt template."""
    global _detect_prompt
    if _detect_prompt is None:
        _detect_prompt = create_prompt_template(DETECT_SYSTEM_MESSAGE)
    return _detect_prompt


def detect_from_keywords(prompt: str) -> tuple[Language | None, DiagramType | None]:
    """Detect language and diagram type from keywords in prompt.

    Args:
        prompt: The user's input prompt.

    Returns:
        A tuple of (detected_language, detected_diagram_type).
        Either or both may be None if not detected.
    """
    prompt_lower = prompt.lower()

    # Language detection
    language: Language | None = None
    if any(ord(c) > 127 for c in prompt):  # Contains non-ASCII
        # Check for Japanese characters
        if re.search(r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]", prompt):
            language = "ja"
    else:
        language = "en"

    # Diagram type detection from keywords
    diagram_type: DiagramType | None = None
    keyword_map: dict[str, DiagramType] = {
        "flowchart": "flowchart",
        "フローチャート": "flowchart",
        "フロー": "flowchart",
        "flow": "flowchart",
        "sequence": "sequence",
        "シーケンス": "sequence",
        "gantt": "gantt",
        "ガント": "gantt",
        "class": "class",
        "クラス": "class",
        "er": "er",
        "entity": "er",
        "エンティティ": "er",
        "state": "state",
        "ステート": "state",
        "状態": "state",
        "journey": "journey",
        "ジャーニー": "journey",
    }

    for keyword, dtype in keyword_map.items():
        if keyword.lower() in prompt_lower:
            diagram_type = dtype
            break

    return language, diagram_type


async def detect_language_and_type(
    state: DiagramState,
) -> dict[str, Language | DiagramType]:
    """Detect language and diagram type from the prompt.

    Args:
        state: The current diagram state.

    Returns:
        A dict with 'language' and 'diagram_type' keys.
    """
    prompt = state["prompt"]

    # First try keyword detection
    keyword_lang, keyword_type = detect_from_keywords(prompt)

    if settings.is_mock_mode:
        # In mock mode, use keyword detection or defaults
        return {
            "language": keyword_lang or "ja",
            "diagram_type": keyword_type or "flowchart",
        }

    # Use LLM for detection
    try:
        client = LLMClient(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0,
        )
        content = await client.invoke_with_prompt(
            _get_detect_prompt(),
            {"prompt": prompt},
        )

        # Parse JSON response
        data = json.loads(content)
        detected_lang: str = data.get("language", "en")
        detected_type: str = data.get("diagram_type", "flowchart")

        # Validate and use keyword detection if more specific
        final_lang: Language = keyword_lang or (
            detected_lang if detected_lang in ("ja", "en", "other") else "en"
        )
        final_type: DiagramType = keyword_type or (
            detected_type
            if detected_type
            in ("flowchart", "sequence", "gantt", "class", "er", "state", "journey")
            else "flowchart"
        )

        return {
            "language": final_lang,
            "diagram_type": final_type,
        }
    except Exception as e:
        # Fallback to keyword detection or defaults
        logger.warning(f"Failed to detect language/type via LLM: {e}")

    return {
        "language": keyword_lang or "en",
        "diagram_type": keyword_type or "flowchart",
    }
