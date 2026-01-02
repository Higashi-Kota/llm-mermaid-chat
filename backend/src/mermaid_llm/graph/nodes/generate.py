"""Node for generating Mermaid code from prompt."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from mermaid_llm.config import settings
from mermaid_llm.graph.state import DiagramState, DiagramType
from mermaid_llm.llm import LLMClient, create_prompt_template

if TYPE_CHECKING:
    from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

GENERATE_SYSTEM_MESSAGE = """You are a Mermaid diagram expert. \
Generate valid Mermaid code for a {diagram_type} diagram.

Rules:
- Output ONLY the Mermaid code, no markdown fences (no ```)
- Use proper Mermaid syntax for the diagram type
- For Japanese text, use appropriate labels
- Keep node IDs simple (A, B, C or descriptive like login, auth)
- Ensure the diagram is complete and valid
- Do not include any explanations, just the diagram code

Example for flowchart:
flowchart TD
    A[Start] --> B{{Decision}}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E"""

_generate_prompt: ChatPromptTemplate | None = None


def _get_generate_prompt() -> ChatPromptTemplate:
    """Get or create the generate prompt template."""
    global _generate_prompt
    if _generate_prompt is None:
        _generate_prompt = create_prompt_template(
            GENERATE_SYSTEM_MESSAGE,
            "{prompt}",
        )
    return _generate_prompt


# Large mock diagram for testing
LARGE_MOCK_FLOWCHART = """flowchart TD
    subgraph Frontend["フロントエンド"]
        A[ユーザー入力] --> B{入力検証}
        B -->|有効| C[API呼び出し]
        B -->|無効| D[エラー表示]
        D --> A
        C --> E{レスポンス確認}
        E -->|成功| F[状態更新]
        E -->|エラー| G[エラーハンドリング]
        G --> H{リトライ?}
        H -->|はい| C
        H -->|いいえ| D
        F --> I[UI更新]
        I --> J[完了通知]
    end

    subgraph Backend["バックエンド"]
        K[APIエンドポイント] --> L{認証確認}
        L -->|認証済み| M[リクエスト解析]
        L -->|未認証| N[401エラー]
        M --> O{バリデーション}
        O -->|有効| P[ビジネスロジック]
        O -->|無効| Q[400エラー]
        P --> R{DB操作}
        R -->|成功| S[レスポンス生成]
        R -->|失敗| T[500エラー]
        S --> U[ログ記録]
        U --> V[レスポンス送信]
    end

    subgraph Database["データベース"]
        W[(PostgreSQL)] --> X{クエリ実行}
        X -->|SELECT| Y[データ取得]
        X -->|INSERT| Z[データ挿入]
        X -->|UPDATE| AA[データ更新]
        X -->|DELETE| AB[データ削除]
        Y --> AC{キャッシュ確認}
        AC -->|ヒット| AD[キャッシュ返却]
        AC -->|ミス| AE[DB読み込み]
        AE --> AF[キャッシュ更新]
        AF --> AD
    end

    subgraph External["外部サービス"]
        AG[OpenAI API] --> AH{レート制限}
        AH -->|OK| AI[リクエスト処理]
        AH -->|制限中| AJ[待機/リトライ]
        AJ --> AH
        AI --> AK[レスポンス生成]
        AK --> AL{検証}
        AL -->|有効| AM[結果返却]
        AL -->|無効| AN[再生成]
        AN --> AI
    end

    C --> K
    V --> E
    P --> W
    P --> AG
    AM --> S"""

# Mock diagrams for each type
MOCK_DIAGRAMS: dict[DiagramType, str] = {
    "flowchart": """flowchart TD
    A[開始] --> B{条件分岐}
    B -->|Yes| C[処理A]
    B -->|No| D[処理B]
    C --> E[終了]
    D --> E""",
    "sequence": """sequenceDiagram
    participant U as ユーザー
    participant S as サーバー
    participant D as データベース
    U->>S: リクエスト送信
    S->>D: データ取得
    D-->>S: データ返却
    S-->>U: レスポンス返却""",
    "gantt": """gantt
    title プロジェクトスケジュール
    dateFormat YYYY-MM-DD
    section 計画
        要件定義: a1, 2024-01-01, 7d
        設計: a2, after a1, 14d
    section 開発
        実装: a3, after a2, 21d
        テスト: a4, after a3, 14d""",
    "class": """classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Order {
        +int id
        +Date date
        +calculate()
    }
    User "1" --> "*" Order : places""",
    "er": """erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created_at
        int user_id FK
    }""",
    "state": """stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Success : complete
    Processing --> Error : fail
    Success --> [*]
    Error --> Idle : retry""",
    "journey": """journey
    title ユーザー登録フロー
    section 登録
        フォーム入力: 5: User
        確認メール受信: 3: User
        メール確認: 4: User
    section 利用開始
        ログイン: 5: User
        プロフィール設定: 4: User""",
}


# Return type for generate_mermaid node
GenerateResult = dict[str, str | int | list[str] | None]


def _clean_mermaid_code(content: str) -> str:
    """Remove markdown fences from mermaid code if present.

    Args:
        content: The raw content from LLM response.

    Returns:
        Cleaned mermaid code without markdown fences.
    """
    mermaid_code = content.strip()
    if mermaid_code.startswith("```"):
        lines = mermaid_code.split("\n")
        # Remove first and last lines (fences)
        if lines[-1] == "```":
            mermaid_code = "\n".join(lines[1:-1])
        else:
            mermaid_code = "\n".join(lines[1:])
    return mermaid_code.strip()


async def generate_mermaid(state: DiagramState) -> GenerateResult:
    """Generate Mermaid code from the prompt.

    Args:
        state: The current diagram state.

    Returns:
        A dict with 'mermaid_code', 'attempts', and optionally 'errors' keys.
    """
    diagram_type = state["diagram_type"]
    prompt = state["prompt"]
    attempts = state["attempts"]

    if settings.is_mock_mode:
        # Mock mode: return sample diagram based on type
        prompt_lower = prompt.lower()
        # Check for large/complex keywords to return large mock diagram
        large_keywords = ["巨大", "大きい", "複雑", "large", "complex", "big", "huge"]
        if any(kw in prompt_lower for kw in large_keywords):
            mermaid_code = LARGE_MOCK_FLOWCHART
        else:
            mermaid_code = MOCK_DIAGRAMS.get(diagram_type, MOCK_DIAGRAMS["flowchart"])
        return {
            "mermaid_code": mermaid_code,
            "attempts": attempts + 1,
        }

    # Use LLM to generate diagram
    try:
        client = LLMClient(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
        content = await client.invoke_with_prompt(
            _get_generate_prompt(),
            {"prompt": prompt, "diagram_type": diagram_type},
        )
        logger.info(f"LLM response received, length: {len(content)}")

        mermaid_code = _clean_mermaid_code(content)
        return {
            "mermaid_code": mermaid_code,
            "attempts": attempts + 1,
        }
    except Exception as e:
        logger.exception(f"Error in LLM generation: {e}")
        return {
            "mermaid_code": None,
            "errors": [str(e)],
            "attempts": attempts + 1,
        }
