"""Integration tests for diagram API endpoints."""

import pytest
from httpx import AsyncClient


class TestDiagramAPI:
    """Tests for diagram API endpoints."""

    @pytest.mark.asyncio
    async def test_generate_diagram(self, async_client: AsyncClient):
        """Test generating a diagram via POST /api/diagram."""
        response = await async_client.post(
            "/api/diagram",
            json={"prompt": "Create a simple flowchart"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "mermaid_code" in data
        assert "diagram_type" in data
        assert "language" in data
        assert "errors" in data
        assert "meta" in data

        assert data["diagram_type"] == "flowchart"
        assert "flowchart" in data["mermaid_code"]
        assert data["meta"]["model"] == "mock"

    @pytest.mark.asyncio
    async def test_generate_diagram_japanese(self, async_client: AsyncClient):
        """Test generating a diagram with Japanese prompt."""
        response = await async_client.post(
            "/api/diagram",
            json={"prompt": "シーケンス図を作成してください"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["language"] == "ja"
        assert data["diagram_type"] == "sequence"

    @pytest.mark.asyncio
    async def test_stream_diagram(self, async_client: AsyncClient):
        """Test streaming diagram generation via POST /api/diagram/stream."""
        response = await async_client.post(
            "/api/diagram/stream",
            json={"prompt": "Create a flowchart"},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        # Parse SSE events
        events: list[str] = []
        for line in response.text.split("\n"):
            if line.startswith("event:"):
                event_type = line.replace("event:", "").strip()
                events.append(event_type)

        # Should have meta and done events at minimum
        assert "meta" in events
        assert "done" in events

    @pytest.mark.asyncio
    async def test_generate_diagram_empty_prompt(self, async_client: AsyncClient):
        """Test generating diagram with empty prompt returns error."""
        response = await async_client.post(
            "/api/diagram",
            json={"prompt": ""},
        )
        # Should return validation error
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_large_diagram(self, async_client: AsyncClient):
        """Test generating a large mock diagram."""
        response = await async_client.post(
            "/api/diagram",
            json={"prompt": "Create a large complex system diagram"},
        )
        assert response.status_code == 200
        data = response.json()

        # Large diagram should have subgraphs
        assert "subgraph" in data["mermaid_code"]

    @pytest.mark.asyncio
    async def test_health_check(self, async_client: AsyncClient):
        """Test health check endpoint."""
        response = await async_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
