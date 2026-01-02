"""Tests for validate node."""

import pytest

from mermaid_llm.graph.nodes.validate import validate_mermaid, validate_mermaid_syntax
from mermaid_llm.graph.state import DiagramState


class TestValidateMermaidSyntax:
    """Tests for validate_mermaid_syntax function."""

    def test_valid_flowchart(self):
        """Test validating a correct flowchart."""
        code = """flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[End]
    B -->|No| A"""
        errors = validate_mermaid_syntax(code, "flowchart")
        assert len(errors) == 0

    def test_valid_sequence(self):
        """Test validating a correct sequence diagram."""
        code = """sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi"""
        errors = validate_mermaid_syntax(code, "sequence")
        assert len(errors) == 0

    def test_empty_code(self):
        """Test validating empty code."""
        errors = validate_mermaid_syntax("", "flowchart")
        assert len(errors) == 1
        assert errors[0]["message"] == "Empty diagram code"

    def test_unbalanced_brackets(self):
        """Test detecting unbalanced brackets."""
        code = """flowchart TD
    A[Start --> B{Decision}
    B -->|Yes| C[End]"""
        errors = validate_mermaid_syntax(code, "flowchart")
        assert any(e["message"] == "Unbalanced brackets in diagram" for e in errors)

    def test_empty_node_label(self):
        """Test detecting empty node labels."""
        code = """flowchart TD
    A[] --> B[Valid]"""
        errors = validate_mermaid_syntax(code, "flowchart")
        assert any(e["message"] == "Empty node label detected" for e in errors)

    def test_invalid_diagram_declaration(self):
        """Test detecting invalid diagram type declaration."""
        code = """invalid_diagram TD
    A[Start] --> B[End]"""
        errors = validate_mermaid_syntax(code, "flowchart")
        assert any("Invalid diagram declaration" in e["message"] for e in errors)

    def test_graph_keyword_accepted(self):
        """Test that 'graph' keyword is accepted for flowchart."""
        code = """graph TD
    A[Start] --> B[End]"""
        errors = validate_mermaid_syntax(code, "flowchart")
        assert len(errors) == 0


class TestValidateMermaid:
    """Tests for validate_mermaid function."""

    @pytest.mark.asyncio
    async def test_valid_flowchart(self):
        """Test validating a valid flowchart."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": """flowchart TD
    A[Start] --> B[End]""",
            "errors": [],
            "attempts": 1,
            "is_valid": False,
        }
        result = await validate_mermaid(state)
        assert result["is_valid"] is True
        errors = result["errors"]
        assert isinstance(errors, list)
        assert len(errors) == 0

    @pytest.mark.asyncio
    async def test_invalid_flowchart(self):
        """Test validating an invalid flowchart."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": """flowchart TD
    A[] --> B[End]""",
            "errors": [],
            "attempts": 1,
            "is_valid": False,
        }
        result = await validate_mermaid(state)
        assert result["is_valid"] is False
        errors = result["errors"]
        assert isinstance(errors, list)
        assert len(errors) > 0

    @pytest.mark.asyncio
    async def test_no_mermaid_code(self):
        """Test validating when no mermaid code is present."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": [],
            "attempts": 1,
            "is_valid": False,
        }
        result = await validate_mermaid(state)
        assert result["is_valid"] is False
        errors = result["errors"]
        assert isinstance(errors, list)
        assert "No Mermaid code generated" in errors

    @pytest.mark.asyncio
    async def test_preserve_existing_errors(self):
        """Test that existing errors are preserved."""
        state: DiagramState = {
            "prompt": "test",
            "language": "en",
            "diagram_type": "flowchart",
            "diagram_type_hint": None,
            "language_hint": None,
            "mermaid_code": None,
            "errors": ["Previous API error"],
            "attempts": 1,
            "is_valid": False,
        }
        result = await validate_mermaid(state)
        errors = result["errors"]
        assert isinstance(errors, list)
        assert "Previous API error" in errors
