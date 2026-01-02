# LLM Mermaid Chat

プロンプトからMermaid図を生成するチャットアプリ。

## 構造

```
frontend/           # React 19 モノレポ (pnpm)
  apps/client-app/  # メインアプリ
  packages/         # 共有ライブラリ (types, chat, mermaid)
backend/            # FastAPI + LangGraph
  src/mermaid_llm/  # ソースコード
  tests/            # pytest
```

## 開発コマンド

### フロントエンド

```bash
pnpm dev                    # 開発サーバー (5174)
pnpm build                  # ビルド
pnpm lint && pnpm typecheck # 検証
```

### バックエンド

```bash
cd backend
uv run fastapi dev src/mermaid_llm/main.py  # 開発 (8000)
uv run ruff check . && uv run pyright       # 検証
uv run pytest                                # テスト
```

## コーディング規約

### フロントエンド

- Biome (lint/format)
- 状態管理: useSyncExternalStore
- TypeScript strict mode

### バックエンド

- ruff + pyright (strict)
- 非同期I/O (asyncpg, SQLAlchemy async)
- LangGraph: detect -> generate -> validate -> autofix

## アーキテクチャ

```
Frontend (React) ─SSE→ Backend (FastAPI) ─→ LangGraph ─→ OpenAI
                                         └─→ PostgreSQL
```
