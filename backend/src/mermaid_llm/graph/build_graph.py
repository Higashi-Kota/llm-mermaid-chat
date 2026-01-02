"""Build the LangGraph diagram generation graph."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal

from langgraph.graph import END, START, StateGraph  # type: ignore[import-untyped]

from mermaid_llm.graph.nodes.autofix import autofix_mermaid
from mermaid_llm.graph.nodes.detect import detect_language_and_type
from mermaid_llm.graph.nodes.generate import generate_mermaid
from mermaid_llm.graph.nodes.validate import validate_mermaid
from mermaid_llm.graph.state import DiagramState

if TYPE_CHECKING:
    from langgraph.graph.state import CompiledStateGraph  # type: ignore[import-untyped]


def should_autofix(state: DiagramState) -> Literal["autofix", "end"]:
    """Determine if autofix should be attempted.

    Args:
        state: The current diagram state.

    Returns:
        "autofix" if autofix should be attempted, "end" otherwise.
    """
    if state["is_valid"]:
        return "end"
    if state["attempts"] >= 2:  # Max 1 autofix attempt (attempts starts at 0)
        return "end"
    return "autofix"


def build_diagram_graph() -> CompiledStateGraph:  # type: ignore[type-arg]
    """Build and compile the diagram generation graph.

    Flow:
    START -> detect -> generate -> validate -> [autofix or END]
                                      |
                                      v (if invalid and attempts < 2)
                                   autofix -> validate -> END

    Returns:
        A compiled LangGraph state machine for diagram generation.
    """
    graph: StateGraph = StateGraph(DiagramState)  # type: ignore[type-arg]

    # Add nodes
    graph.add_node("detect", detect_language_and_type)  # type: ignore[arg-type]
    graph.add_node("generate", generate_mermaid)  # type: ignore[arg-type]
    graph.add_node("validate", validate_mermaid)  # type: ignore[arg-type]
    graph.add_node("autofix", autofix_mermaid)  # type: ignore[arg-type]

    # Add edges
    graph.add_edge(START, "detect")
    graph.add_edge("detect", "generate")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges(
        "validate",
        should_autofix,
        {
            "autofix": "autofix",
            "end": END,
        },
    )
    graph.add_edge("autofix", "validate")

    return graph.compile()  # type: ignore[return-value]


# Pre-compiled graph for reuse
diagram_graph: CompiledStateGraph = build_diagram_graph()  # type: ignore[type-arg]
