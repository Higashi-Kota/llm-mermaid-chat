"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field


class DiagramRequest(BaseModel):
    """Request schema for diagram generation."""

    prompt: str = Field(..., min_length=1, description="Prompt describing the diagram")
    language_hint: str = Field(
        default="auto", description="Language hint: auto, ja, or en"
    )
    diagram_type_hint: str = Field(
        default="auto",
        description=(
            "Diagram type hint: auto, flowchart, sequence, "
            "gantt, class, er, state, journey"
        ),
    )


class DiagramMeta(BaseModel):
    """Metadata for diagram generation."""

    model: str
    latency_ms: int
    attempts: int
    trace_id: str | None = None


class DiagramResponse(BaseModel):
    """Response schema for diagram generation."""

    mermaid_code: str
    diagram_type: str
    language: str
    errors: list[str]
    meta: DiagramMeta


class SSEMetaEvent(BaseModel):
    """SSE meta event data."""

    trace_id: str
    model: str
    diagram_type: str
    language: str


class SSEChunkEvent(BaseModel):
    """SSE chunk event data."""

    text: str


class SSEErrorEvent(BaseModel):
    """SSE error event data."""

    code: str
    message: str
    trace_id: str
