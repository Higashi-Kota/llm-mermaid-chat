# LLM Mermaid Chat

自然言語プロンプトからMermaid図を生成するチャットアプリ

## 機能

- SSEストリーミングでリアルタイム生成
- 7種類の図（flowchart, sequence, gantt, class, er, state, journey）
- pan-zoom, フルスクリーン対応

## クイックスタート

### 前提条件

- Node.js 22+
- pnpm
- Python 3.11+
- uv
- Docker

### 起動

```bash
# DB起動
docker compose up postgres -d

# バックエンド
cd backend
cp .env.example .env  # OPENAI_API_KEY を設定
uv sync
uv run fastapi dev src/mermaid_llm/main.py

# フロントエンド (別ターミナル)
pnpm install
pnpm dev
```

http://localhost:5174 でアクセス

### 停止

```bash
docker compose down
```

### 環境変数 (backend/.env)

```
DATABASE_URL=postgresql+asyncpg://mermaid_llm:dev_password@localhost:5433/mermaid_llm
OPENAI_API_KEY=sk-...
USE_MOCK=false
```

## 技術スタック

| 領域 | 技術 |
|-----|------|
| Frontend | React 19, Vite, Tailwind CSS, Mermaid |
| Backend | FastAPI, LangGraph, SQLAlchemy, PostgreSQL |
| LLM | OpenAI (gpt-4o) |

## ドキュメント

- [docs/deploy.md](./docs/deploy.md) - デプロイ手順
