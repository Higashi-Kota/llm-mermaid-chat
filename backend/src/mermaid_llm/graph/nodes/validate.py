"""Node for validating Mermaid syntax."""

from __future__ import annotations

import logging
import re
from typing import TypedDict

from mermaid_llm.api.error_codes import ErrorCode
from mermaid_llm.graph.state import DiagramState, DiagramType

logger = logging.getLogger(__name__)


class ValidationError(TypedDict):
    """Structured validation error."""

    code: ErrorCode
    message: str


# Basic Mermaid syntax patterns for validation
DIAGRAM_PATTERNS: dict[DiagramType, str] = {
    "flowchart": r"^(flowchart|graph)\s+(TB|TD|BT|RL|LR)",
    "sequence": r"^sequenceDiagram",
    "gantt": r"^gantt",
    "class": r"^classDiagram",
    "er": r"^erDiagram",
    "state": r"^stateDiagram(-v2)?",
    "journey": r"^journey",
}


def validate_mermaid_syntax(
    code: str, diagram_type: DiagramType
) -> list[ValidationError]:
    """Validate Mermaid syntax and return list of structured errors."""
    errors: list[ValidationError] = []

    if not code or not code.strip():
        errors.append(
            ValidationError(
                code=ErrorCode.GENERATION_EMPTY, message="Empty diagram code"
            )
        )
        return errors

    lines = code.strip().split("\n")
    first_line = lines[0].strip() if lines else ""

    # Check diagram type declaration
    pattern = DIAGRAM_PATTERNS.get(diagram_type)
    if pattern and not re.match(pattern, first_line, re.IGNORECASE):
        # Try to detect any valid diagram type
        found_type = False
        for _dtype, ptn in DIAGRAM_PATTERNS.items():
            if re.match(ptn, first_line, re.IGNORECASE):
                found_type = True
                break
        if not found_type:
            errors.append(
                ValidationError(
                    code=ErrorCode.VALIDATION_INVALID_TYPE,
                    message=f"Invalid diagram declaration for type '{diagram_type}'",
                )
            )

    # Check for common syntax errors (bracket balance)
    # For ER diagrams, remove relationship cardinality syntax before counting
    # (e.g., ||--o{, }o--||, }|..|{) as they use unbalanced braces by design
    code_for_brackets = code
    if diagram_type == "er":
        # Remove ER relationship patterns: ||--o{, }o--||, }|..|{, etc.
        er_pattern = r"[\|}][|o][-.]+-*[o|{][\|{]?|[|o}][-.]+-*[o|{]"
        code_for_brackets = re.sub(er_pattern, "", code)

    open_brackets = (
        code_for_brackets.count("[")
        + code_for_brackets.count("{")
        + code_for_brackets.count("(")
    )
    close_brackets = (
        code_for_brackets.count("]")
        + code_for_brackets.count("}")
        + code_for_brackets.count(")")
    )
    if open_brackets != close_brackets:
        errors.append(
            ValidationError(
                code=ErrorCode.VALIDATION_UNBALANCED_BRACKETS,
                message="Unbalanced brackets in diagram",
            )
        )

    # Check for empty node definitions
    if re.search(r"\[\s*\]", code):
        errors.append(
            ValidationError(
                code=ErrorCode.VALIDATION_EMPTY_NODE,
                message="Empty node label detected",
            )
        )

    # Check for invalid arrow syntax in flowcharts
    if diagram_type == "flowchart":
        # Valid arrows: -->, --->, -.->-, ==>, etc.
        invalid_arrows = re.findall(r"[A-Za-z0-9_]+\s*-+[^->|]+[A-Za-z0-9_]+", code)
        if invalid_arrows:
            errors.append(
                ValidationError(
                    code=ErrorCode.VALIDATION_SYNTAX_ERROR,
                    message="Possible invalid arrow syntax in flowchart",
                )
            )

    return errors


def errors_to_strings(errors: list[ValidationError]) -> list[str]:
    """Convert structured errors to string list for backward compatibility."""
    return [e["message"] for e in errors]


# Return type for validate_mermaid node
ValidateResult = dict[str, bool | list[str]]


async def validate_mermaid(state: DiagramState) -> ValidateResult:
    """Validate the generated Mermaid code.

    Args:
        state: The current diagram state.

    Returns:
        A dict with 'is_valid' and 'errors' keys.
    """
    mermaid_code = state.get("mermaid_code")
    diagram_type = state["diagram_type"]
    existing_errors = state.get("errors", [])

    if not mermaid_code:
        # Preserve existing errors (e.g., API errors from generate)
        validation_errors: list[str] = existing_errors or ["No Mermaid code generated"]
        return {
            "is_valid": False,
            "errors": validation_errors,
        }

    structured_errors = validate_mermaid_syntax(mermaid_code, diagram_type)
    # Convert structured errors to strings for backward compatibility
    error_strings = errors_to_strings(structured_errors)
    # Combine existing errors with validation errors
    all_errors: list[str] = existing_errors + error_strings

    return {
        "is_valid": len(structured_errors) == 0,
        "errors": all_errors if all_errors else [],
    }
