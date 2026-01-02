"""LangGraph state definition."""

from typing import Literal, TypedDict

DiagramType = Literal[
    "flowchart", "sequence", "gantt", "class", "er", "state", "journey"
]
Language = Literal["ja", "en", "other"]


class DiagramState(TypedDict):
    """State for the diagram generation graph."""

    prompt: str
    language: Language
    diagram_type: DiagramType
    diagram_type_hint: str | None  # User-specified hint (None or "auto" = auto-detect)
    language_hint: str | None  # User-specified hint (None or "auto" = auto-detect)
    mermaid_code: str | None
    errors: list[str]
    attempts: int
    is_valid: bool
