"""Integration tests for diagram database persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

import pytest

from mermaid_llm.db import DiagramStatus
from mermaid_llm.services import DiagramRepository

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class TestDiagramRepository:
    """Tests for DiagramRepository persistence operations."""

    @pytest.mark.asyncio
    async def test_create_diagram(self, db_session: AsyncSession) -> None:
        """Test creating a new diagram record."""
        repo = DiagramRepository(db_session)
        trace_id = str(uuid4())

        diagram = await repo.create(
            trace_id=trace_id,
            prompt="Create a flowchart",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.COMPLETED,
            mermaid_code="flowchart TD\n    A[Start] --> B[End]",
            model="gpt-4o",
            latency_ms=150,
            attempts=1,
        )

        assert diagram.id is not None
        assert diagram.trace_id == trace_id
        assert diagram.prompt == "Create a flowchart"
        assert diagram.language == "en"
        assert diagram.diagram_type == "flowchart"
        assert diagram.status == DiagramStatus.COMPLETED
        assert diagram.mermaid_code is not None
        assert "flowchart" in diagram.mermaid_code
        assert diagram.model == "gpt-4o"
        assert diagram.latency_ms == 150
        assert diagram.attempts == 1
        assert diagram.created_at is not None
        assert diagram.updated_at is not None

    @pytest.mark.asyncio
    async def test_get_by_id(self, db_session: AsyncSession) -> None:
        """Test retrieving a diagram by ID."""
        repo = DiagramRepository(db_session)

        # Create a diagram
        created = await repo.create(
            trace_id=str(uuid4()),
            prompt="Test prompt",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.COMPLETED,
        )

        # Retrieve by ID
        found = await repo.get_by_id(created.id)
        assert found is not None
        assert found.id == created.id
        assert found.prompt == "Test prompt"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, db_session: AsyncSession) -> None:
        """Test retrieving a non-existent diagram returns None."""
        repo = DiagramRepository(db_session)
        result = await repo.get_by_id(uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_trace_id(self, db_session: AsyncSession) -> None:
        """Test retrieving diagrams by trace ID."""
        repo = DiagramRepository(db_session)
        trace_id = str(uuid4())

        # Create multiple diagrams with same trace_id
        await repo.create(
            trace_id=trace_id,
            prompt="First attempt",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.FAILED,
        )
        await repo.create(
            trace_id=trace_id,
            prompt="Second attempt",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.COMPLETED,
        )

        # Retrieve by trace_id
        diagrams = await repo.get_by_trace_id(trace_id)
        assert len(diagrams) == 2

    @pytest.mark.asyncio
    async def test_update_diagram(self, db_session: AsyncSession) -> None:
        """Test updating a diagram."""
        repo = DiagramRepository(db_session)

        # Create a diagram
        diagram = await repo.create(
            trace_id=str(uuid4()),
            prompt="Test prompt",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.PENDING,
        )

        # Update it
        updated = await repo.update(
            diagram,
            status=DiagramStatus.COMPLETED,
            mermaid_code="flowchart TD\n    A --> B",
            latency_ms=200,
        )

        assert updated.status == DiagramStatus.COMPLETED
        assert updated.mermaid_code == "flowchart TD\n    A --> B"
        assert updated.latency_ms == 200

    @pytest.mark.asyncio
    async def test_list_recent(self, db_session: AsyncSession) -> None:
        """Test listing recent diagrams."""
        repo = DiagramRepository(db_session)

        # Create multiple diagrams
        for i in range(5):
            await repo.create(
                trace_id=str(uuid4()),
                prompt=f"Prompt {i}",
                language="en",
                diagram_type="flowchart",
                status=DiagramStatus.COMPLETED,
            )

        # List recent
        diagrams = await repo.list_recent(limit=3)
        assert len(diagrams) == 3

    @pytest.mark.asyncio
    async def test_delete_diagram(self, db_session: AsyncSession) -> None:
        """Test deleting a diagram."""
        repo = DiagramRepository(db_session)

        # Create a diagram
        diagram = await repo.create(
            trace_id=str(uuid4()),
            prompt="To be deleted",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.COMPLETED,
        )
        diagram_id = diagram.id

        # Delete it
        await repo.delete(diagram)

        # Verify it's gone
        found = await repo.get_by_id(diagram_id)
        assert found is None

    @pytest.mark.asyncio
    async def test_failed_diagram_with_error(self, db_session: AsyncSession) -> None:
        """Test creating a failed diagram with error message."""
        repo = DiagramRepository(db_session)

        diagram = await repo.create(
            trace_id=str(uuid4()),
            prompt="Invalid prompt",
            language="en",
            diagram_type="flowchart",
            status=DiagramStatus.FAILED,
            error_message="API error: Rate limit exceeded",
        )

        assert diagram.status == DiagramStatus.FAILED
        assert diagram.error_message == "API error: Rate limit exceeded"
        assert diagram.mermaid_code is None
