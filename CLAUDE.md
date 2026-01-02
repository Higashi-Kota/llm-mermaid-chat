# LLM Mermaid Chat

プロンプトからMermaid図を生成するチャットアプリ。

**Design Principles**: No custom hooks, useMemo, or useCallback. Initialize core in App.tsx, pass via props to containers.

## 構造

```
frontend/           # React 19 モノレポ (pnpm)
  apps/client-app/  # メインアプリ
  packages/         # 共有ライブラリ (types, chat, mermaid, api-client)
backend/            # FastAPI + LangGraph
  src/mermaid_llm/  # ソースコード
  tests/            # pytest
specs/              # TypeSpec API 定義 → OpenAPI 生成
```

## 開発コマンド

### フロントエンド

```bash
pnpm dev                    # 開発サーバー (5175)
pnpm build                  # ビルド
pnpm lint && pnpm typecheck # 検証
pnpm e2e                    # E2Eテスト
```

### バックエンド

```bash
cd backend
uv run fastapi dev src/mermaid_llm/main.py  # 開発 (8000)
uv run ruff check . && uv run pyright       # 検証
uv run pytest                                # テスト
```

### API スキーマ (TypeSpec)

```bash
pnpm spec:compile           # TypeSpec → OpenAPI 生成
pnpm generate:all           # OpenAPI → TypeScript クライアント生成
```

**重要**: `specs/` 配下の TypeSpec ファイルを変更した場合は `pnpm generate:all` を実行し、生成されたコードをコミットしてください。

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
