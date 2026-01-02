"""Node for auto-fixing Mermaid syntax errors."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from mermaid_llm.config import settings
from mermaid_llm.graph.state import DiagramState
from mermaid_llm.llm import LLMClient, create_prompt_template

if TYPE_CHECKING:
    from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

AUTOFIX_SYSTEM_MESSAGE = """You are a Mermaid diagram syntax expert. \
Fix the following Mermaid diagram that has syntax errors.

Errors found:
{errors}

Rules:
- Output ONLY the corrected Mermaid code, no explanations
- Do not include markdown fences (```)
- Preserve the original intent of the diagram
- Fix all syntax errors while keeping the structure intact"""

_autofix_prompt: ChatPromptTemplate | None = None


def _get_autofix_prompt() -> ChatPromptTemplate:
    """Get or create the autofix prompt template."""
    global _autofix_prompt
    if _autofix_prompt is None:
        _autofix_prompt = create_prompt_template(
            AUTOFIX_SYSTEM_MESSAGE,
            "Original diagram:\n{mermaid_code}",
        )
    return _autofix_prompt


# Return type for autofix_mermaid node
AutofixResult = dict[str, str | int | list[str] | None]


def _clean_mermaid_code(content: str) -> str:
    """Remove markdown fences from mermaid code if present.

    Args:
        content: The raw content from LLM response.

    Returns:
        Cleaned mermaid code without markdown fences.
    """
    fixed_code = content.strip()
    if fixed_code.startswith("```"):
        lines = fixed_code.split("\n")
        if lines[-1] == "```":
            fixed_code = "\n".join(lines[1:-1])
        else:
            fixed_code = "\n".join(lines[1:])
    return fixed_code.strip()


async def autofix_mermaid(state: DiagramState) -> AutofixResult:
    """Attempt to fix Mermaid syntax errors.

    Args:
        state: The current diagram state.

    Returns:
        A dict with 'mermaid_code', 'attempts', and optionally 'errors' keys.
    """
    mermaid_code = state.get("mermaid_code", "")
    errors = state.get("errors", [])
    attempts = state["attempts"]

    if settings.is_mock_mode:
        # In mock mode, just return the original code
        # (mock diagrams should be valid)
        return {
            "mermaid_code": mermaid_code,
            "attempts": attempts + 1,
        }

    if not mermaid_code or not errors:
        return {
            "mermaid_code": mermaid_code,
            "attempts": attempts + 1,
        }

    try:
        client = LLMClient(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.3,
        )
        errors_text = "\n".join(f"- {e}" for e in errors)
        content = await client.invoke_with_prompt(
            _get_autofix_prompt(),
            {"mermaid_code": mermaid_code, "errors": errors_text},
        )
        logger.info(f"Autofix response received, length: {len(content)}")

        fixed_code = _clean_mermaid_code(content)
        return {
            "mermaid_code": fixed_code,
            "attempts": attempts + 1,
            "errors": [],  # Clear errors for re-validation
        }
    except Exception as e:
        logger.exception(f"Failed to autofix Mermaid code: {e}")

    return {
        "mermaid_code": mermaid_code,
        "attempts": attempts + 1,
    }
