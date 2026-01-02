"""Tests for generate node."""

import pytest

from mermaid_llm.graph.nodes.generate import (
    MOCK_DIAGRAMS,
    generate_mermaid,
)
from mermaid_llm.graph.state import DiagramState


class TestGenerateMermaid:
    """Tests for generate_mermaid function."""

    @pytest.mark.asyncio
    async def test_generate_flowchart_mock(self):
        """Test generating flowchart in mock mode."""
        state: DiagramState = {
            "prompt": "Create a login flow",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await generate_mermaid(state)
        assert "mermaid_code" in result
        assert result["mermaid_code"] == MOCK_DIAGRAMS["flowchart"]
        assert result["attempts"] == 1

    @pytest.mark.asyncio
    async def test_generate_sequence_mock(self):
        """Test generating sequence diagram in mock mode."""
        state: DiagramState = {
            "prompt": "Create a sequence diagram",
            "language": "en",
            "diagram_type": "sequence",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await generate_mermaid(state)
        assert result["mermaid_code"] == MOCK_DIAGRAMS["sequence"]
        assert result["attempts"] == 1

    @pytest.mark.asyncio
    async def test_generate_gantt_mock(self):
        """Test generating gantt diagram in mock mode."""
        state: DiagramState = {
            "prompt": "Create a gantt chart",
            "language": "en",
            "diagram_type": "gantt",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await generate_mermaid(state)
        assert result["mermaid_code"] == MOCK_DIAGRAMS["gantt"]
        assert result["attempts"] == 1

    @pytest.mark.asyncio
    async def test_generate_large_mock_diagram(self):
        """Test generating large mock diagram with keyword."""
        state: DiagramState = {
            "prompt": "Create a large complex flowchart",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await generate_mermaid(state)
        # Large diagram should have subgraphs
        mermaid_code = result["mermaid_code"]
        assert isinstance(mermaid_code, str)
        assert "subgraph" in mermaid_code
        assert result["attempts"] == 1

    @pytest.mark.asyncio
    async def test_generate_large_mock_japanese_keyword(self):
        """Test generating large mock diagram with Japanese keyword."""
        state: DiagramState = {
            "prompt": "巨大なフローチャートを作成",
            "language": "ja",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await generate_mermaid(state)
        mermaid_code = result["mermaid_code"]
        assert isinstance(mermaid_code, str)
        assert "subgraph" in mermaid_code
