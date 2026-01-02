"""Tests for detect node."""

import pytest

from mermaid_llm.graph.nodes.detect import (
    detect_from_keywords,
    detect_language_and_type,
)
from mermaid_llm.graph.state import DiagramState


class TestDetectFromKeywords:
    """Tests for detect_from_keywords function."""

    def test_detect_japanese_with_flowchart_keyword(self):
        """Test detecting Japanese with flowchart keyword."""
        lang, dtype = detect_from_keywords("フローチャートを作成してください")
        assert lang == "ja"
        assert dtype == "flowchart"

    def test_detect_english_with_sequence_keyword(self):
        """Test detecting English with sequence keyword."""
        lang, dtype = detect_from_keywords("create a sequence diagram")
        assert lang == "en"
        assert dtype == "sequence"

    def test_detect_japanese_with_gantt_keyword(self):
        """Test detecting Japanese with gantt keyword."""
        lang, dtype = detect_from_keywords("ガントチャートを表示")
        assert lang == "ja"
        assert dtype == "gantt"

    def test_detect_english_with_class_keyword(self):
        """Test detecting English with class keyword."""
        lang, dtype = detect_from_keywords("class diagram for user model")
        assert lang == "en"
        assert dtype == "class"

    def test_detect_no_keywords(self):
        """Test with no diagram type keywords."""
        lang, dtype = detect_from_keywords("hello world")
        assert lang == "en"
        assert dtype is None

    def test_detect_japanese_no_diagram_type(self):
        """Test detecting Japanese without diagram type."""
        lang, dtype = detect_from_keywords("こんにちは")
        assert lang == "ja"
        assert dtype is None


class TestDetectLanguageAndType:
    """Tests for detect_language_and_type function."""

    @pytest.mark.asyncio
    async def test_detect_japanese_flowchart(self):
        """Test detecting Japanese flowchart in mock mode."""
        state: DiagramState = {
            "prompt": "ログインフローチャートを作成",
            "language": "en",  # Will be overwritten
            "diagram_type": "flowchart",
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await detect_language_and_type(state)
        assert result["language"] == "ja"
        assert result["diagram_type"] == "flowchart"

    @pytest.mark.asyncio
    async def test_detect_english_sequence(self):
        """Test detecting English sequence diagram in mock mode."""
        state: DiagramState = {
            "prompt": "create a sequence diagram for API calls",
            "language": "en",
            "diagram_type": "flowchart",
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await detect_language_and_type(state)
        assert result["language"] == "en"
        assert result["diagram_type"] == "sequence"

    @pytest.mark.asyncio
    async def test_default_fallback(self):
        """Test default fallback in mock mode when no keywords match."""
        state: DiagramState = {
            "prompt": "図を作成してください",
            "language": "en",
            "diagram_type": "flowchart",
            "mermaid_code": None,
            "errors": [],
            "attempts": 0,
            "is_valid": False,
        }
        result = await detect_language_and_type(state)
        # In mock mode, defaults to "ja" for language if detected
        assert result["language"] == "ja"
        assert result["diagram_type"] == "flowchart"
