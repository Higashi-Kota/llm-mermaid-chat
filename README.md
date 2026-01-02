# LLM Mermaid Chat

プロンプトからMermaid図を生成するチャットアプリケーション。

## 技術スタック

- **Frontend**: React 19, TypeScript, pnpm monorepo
- **Backend**: FastAPI, LangGraph, OpenAI API
- **Database**: PostgreSQL (asyncpg)
- **API定義**: TypeSpec → OpenAPI 3.0

## セットアップ

### 依存関係のインストール

```bash
# フロントエンド
pnpm install

# バックエンド
cd backend && uv sync
```

### 環境変数

```bash
# backend/.env
OPENAI_API_KEY=your-api-key
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/mermaid_llm
```

### 開発サーバー起動

```bash
# フロントエンド (http://localhost:5175)
pnpm dev

# バックエンド (http://localhost:8000)
cd backend && uv run fastapi dev src/mermaid_llm/main.py
```

## API スキーマ管理

このプロジェクトはTypeSpecでAPIスキーマを定義し、コード生成を行っています。

### スキーマの変更手順

1. `specs/` ディレクトリ内の `.tsp` ファイルを編集
2. コード生成を実行:

```bash
pnpm generate:all
```

3. 生成されたコードをコミット

### コマンド

```bash
pnpm spec:compile      # TypeSpec → OpenAPI 3.0 変換
pnpm generate:all      # スキーマ変換 + フロントエンドクライアント生成
```

> **重要**: OpenAPIスキーマを変更した場合は、必ず `pnpm generate:all` を実行し、生成されたコードをコミットしてください。

## プロジェクト構造

```
frontend/
  apps/client-app/     # メインアプリ
  packages/
    api-client/        # 生成されたAPIクライアント (orval)
    types/             # 共有型定義
    mermaid/           # Mermaidビューアー
specs/
  main.tsp             # TypeSpec定義
  tsp-output/          # 生成されたOpenAPI
backend/
  src/mermaid_llm/     # FastAPI + LangGraph
  tests/               # pytest
```

## テスト

```bash
# フロントエンド
pnpm lint && pnpm typecheck

# バックエンド
cd backend
uv run ruff check . && uv run pyright
uv run pytest

# E2Eテスト
pnpm --filter client-app test:e2e
```

## ライセンス

MIT
