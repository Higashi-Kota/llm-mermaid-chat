"""Diagram generation API router."""

from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncGenerator
from typing import Annotated, Any
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from mermaid_llm.api.error_codes import (
    ErrorCode,
    get_error_category,
    get_error_message,
    is_retryable,
)
from mermaid_llm.api.schemas import (
    DiagramMeta,
    DiagramRequest,
    DiagramResponse,
)
from mermaid_llm.config import settings
from mermaid_llm.db import DiagramStatus, get_db
from mermaid_llm.graph.build_graph import (
    diagram_graph,  # type: ignore[reportUnknownVariableType]
)
from mermaid_llm.graph.state import DiagramState
from mermaid_llm.services import DiagramRepository

# FastAPI dependency type alias
DbSession = Annotated[AsyncSession, Depends(get_db)]

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/diagram", tags=["diagram"])


def create_initial_state(
    prompt: str,
    diagram_type_hint: str | None = None,
    language_hint: str | None = None,
) -> DiagramState:
    """Create initial state for the graph.

    Args:
        prompt: User's input prompt.
        diagram_type_hint: Optional diagram type hint (None/"auto" = auto-detect).
        language_hint: Optional language hint (None/"auto" = auto-detect).
    """
    # Normalize "auto" to None (auto-detect)
    type_hint = None if diagram_type_hint in (None, "auto") else diagram_type_hint
    lang_hint = None if language_hint in (None, "auto") else language_hint
    return {
        "prompt": prompt,
        "language": "en",
        "diagram_type": "flowchart",
        "diagram_type_hint": type_hint,
        "language_hint": lang_hint,
        "mermaid_code": None,
        "errors": [],
        "attempts": 0,
        "is_valid": False,
    }


async def _save_diagram_result(
    db: AsyncSession,
    *,
    trace_id: str,
    prompt: str,
    result: dict[str, Any],
    model_name: str,
    latency_ms: int,
) -> None:
    """Save diagram generation result to database.

    Args:
        db: Database session.
        trace_id: Unique trace identifier.
        prompt: User's input prompt.
        result: Generation result from graph.
        model_name: Model used for generation.
        latency_ms: Time taken in milliseconds.
    """
    mermaid_code = result.get("mermaid_code")
    errors = result.get("errors", [])

    # Determine status based on result
    if mermaid_code and result.get("is_valid", True):
        status = DiagramStatus.COMPLETED
    elif errors:
        status = DiagramStatus.FAILED
    else:
        status = DiagramStatus.COMPLETED

    repo = DiagramRepository(db)
    try:
        await repo.create(
            trace_id=trace_id,
            prompt=prompt,
            language=result.get("language", "en"),
            diagram_type=result.get("diagram_type", "flowchart"),
            status=status,
            mermaid_code=mermaid_code,
            error_message="; ".join(errors) if errors else None,
            model=model_name,
            latency_ms=latency_ms,
            attempts=result.get("attempts", 1),
        )
    except Exception as e:
        # Log but don't fail the request if DB save fails
        logger.exception(f"Failed to save diagram to database: {e}")


@router.post("", response_model=DiagramResponse)
async def generate_diagram(
    request: DiagramRequest,
    db: DbSession,
) -> DiagramResponse:
    """Generate a Mermaid diagram from the prompt (non-streaming)."""
    start = time.perf_counter()
    trace_id = str(uuid4())

    initial_state = create_initial_state(
        request.prompt, request.diagram_type_hint, request.language_hint
    )
    # LangGraph types are not fully typed
    result: dict[str, Any] = await diagram_graph.ainvoke(  # type: ignore[reportUnknownMemberType]
        initial_state
    )

    latency_ms = int((time.perf_counter() - start) * 1000)
    model_name = "mock" if settings.is_mock_mode else settings.openai_model

    # Save to database (skip in mock mode for E2E tests without DB)
    if not settings.is_mock_mode:
        await _save_diagram_result(
            db,
            trace_id=trace_id,
            prompt=request.prompt,
            result=result,
            model_name=model_name,
            latency_ms=latency_ms,
        )

    return DiagramResponse(
        mermaid_code=result.get("mermaid_code") or "",
        diagram_type=result.get("diagram_type", "flowchart"),
        language=result.get("language", "en"),
        errors=result.get("errors", []),
        meta=DiagramMeta(
            model=model_name,
            latency_ms=latency_ms,
            attempts=result.get("attempts", 1),
            trace_id=trace_id,
        ),
    )


def create_error_event(
    code: ErrorCode,
    trace_id: str,
    event_id: int,
    details: list[str] | None = None,
) -> dict[str, Any]:
    """Create a structured error event."""
    return {
        "id": f"{trace_id}:{event_id}",
        "event": "error",
        "data": json.dumps(
            {
                "code": code.value,
                "category": get_error_category(code).value,
                "message": get_error_message(code),
                "details": details,
                "trace_id": trace_id,
                "retryable": is_retryable(code),
            }
        ),
    }


@router.post("/stream")
async def stream_diagram(
    request: DiagramRequest,
    db: DbSession,
) -> EventSourceResponse:
    """Generate a Mermaid diagram with SSE streaming."""

    async def event_generator() -> AsyncGenerator[dict[str, Any], None]:
        trace_id = str(uuid4())
        start = time.perf_counter()
        event_id = 0

        initial_state = create_initial_state(
            request.prompt, request.diagram_type_hint, request.language_hint
        )
        model_name = "mock" if settings.is_mock_mode else settings.openai_model

        # Send meta event first
        event_id += 1
        yield {
            "id": f"{trace_id}:{event_id}",
            "event": "meta",
            "data": json.dumps(
                {
                    "trace_id": trace_id,
                    "model": model_name,
                    "diagram_type": "flowchart",  # Will be updated
                    "language": "en",  # Will be updated
                }
            ),
        }

        # Stream graph execution (LangGraph types are not fully typed)
        final_result: dict[str, Any] | None = None
        try:
            async for chunk in diagram_graph.astream(  # type: ignore[reportUnknownMemberType]
                initial_state,
                stream_mode="updates",
            ):
                # Each chunk is a dict with node name -> output
                for _node_name, output in chunk.items():
                    # Send chunk events for mermaid code updates
                    if "mermaid_code" in output and output["mermaid_code"]:
                        event_id += 1
                        yield {
                            "id": f"{trace_id}:{event_id}",
                            "event": "chunk",
                            "data": json.dumps({"text": output["mermaid_code"]}),
                        }

                    # Track the latest state
                    if output:
                        if final_result is None:
                            final_result = dict(initial_state)
                        final_result.update(output)

        except Exception as e:
            logger.exception(f"Error during diagram streaming: {e}")
            event_id += 1
            yield create_error_event(
                ErrorCode.GENERATION_FAILED,
                trace_id,
                event_id,
                details=[str(e)],
            )
            return

        # Send done event with final result
        latency_ms = int((time.perf_counter() - start) * 1000)

        if final_result:
            # Save to database (skip in mock mode for E2E tests without DB)
            if not settings.is_mock_mode:
                await _save_diagram_result(
                    db,
                    trace_id=trace_id,
                    prompt=request.prompt,
                    result=final_result,
                    model_name=model_name,
                    latency_ms=latency_ms,
                )

            event_id += 1
            yield {
                "id": f"{trace_id}:{event_id}",
                "event": "done",
                "data": json.dumps(
                    {
                        "mermaid_code": final_result.get("mermaid_code") or "",
                        "diagram_type": final_result.get("diagram_type", "flowchart"),
                        "language": final_result.get("language", "en"),
                        "errors": final_result.get("errors", []),
                        "meta": {
                            "model": model_name,
                            "latency_ms": latency_ms,
                            "attempts": final_result.get("attempts", 1),
                            "trace_id": trace_id,
                        },
                    }
                ),
            }
        else:
            event_id += 1
            yield create_error_event(
                ErrorCode.GENERATION_EMPTY,
                trace_id,
                event_id,
            )

    return EventSourceResponse(event_generator())
