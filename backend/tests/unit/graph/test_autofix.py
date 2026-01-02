"""Tests for autofix node."""

import pytest

from mermaid_llm.graph.nodes.autofix import autofix_mermaid
from mermaid_llm.graph.state import DiagramState


class TestAutofixMermaid:
    """Tests for autofix_mermaid function in mock mode."""

    @pytest.mark.asyncio
    async def test_autofix_returns_original_in_mock(self):
        """Test that autofix returns original code in mock mode."""
        original_code = """flowchart TD
    A[Start] --> B[End]"""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": original_code,
            "errors": ["Some error"],
            "attempts": 1,
            "is_valid": False,
        }
        result = await autofix_mermaid(state)
        assert result["mermaid_code"] == original_code
        assert result["attempts"] == 2

    @pytest.mark.asyncio
    async def test_autofix_increments_attempts(self):
        """Test that autofix increments attempt counter."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": "flowchart TD\n    A --> B",
            "errors": ["error"],
            "attempts": 0,
            "is_valid": False,
        }
        result = await autofix_mermaid(state)
        assert result["attempts"] == 1

    @pytest.mark.asyncio
    async def test_autofix_no_errors(self):
        """Test autofix with no errors returns original code."""
        original_code = "flowchart TD\n    A --> B"
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": original_code,
            "errors": [],
            "attempts": 1,
            "is_valid": True,
        }
        result = await autofix_mermaid(state)
        assert result["mermaid_code"] == original_code

    @pytest.mark.asyncio
    async def test_autofix_no_code(self):
        """Test autofix with no mermaid code."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": ["No code"],
            "attempts": 1,
            "is_valid": False,
        }
        result = await autofix_mermaid(state)
        # When no code, returns empty string (from state.get default)
        assert result["mermaid_code"] in ("", None)
        assert result["attempts"] == 2
