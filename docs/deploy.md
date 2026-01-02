# デプロイ

## Docker Compose (ローカル)

```bash
# 起動
docker compose up --build -d

# 停止
docker compose down
```

| サービス | ポート | 説明 |
|---------|-------|------|
| postgres | 5433 | PostgreSQL |
| backend | 8000 | FastAPI |
| frontend | 5175 | Nginx |

## 本番 (Render.com)

### バックエンド (Web Service)

- Dockerfile: `Dockerfile.backend`
- 環境変数:
  - `DATABASE_URL`: Render PostgreSQL接続URL
  - `OPENAI_API_KEY`: OpenAI APIキー
  - `CORS_ORIGINS`: フロントエンドURL
  - `PORT`: 10000 (Render標準)

### フロントエンド (Web Service)

- Dockerfile: `Dockerfile.frontend`
- `VITE_API_URL`はDockerfileにデフォルト埋め込み済み
- nginxは静的ファイル配信のみ（APIプロキシなし）

### データベース (PostgreSQL)

- Neon PostgreSQL を使用
- 接続URLをバックエンドの `DATABASE_URL` に設定

## GitHub Actions

### Secrets (Settings > Secrets and variables > Actions)

| Secret | 説明 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL接続URL（マイグレーション用） |
| `RENDER_BACKEND_DEPLOY_HOOK` | Renderバックエンドのデプロイフック |
| `RENDER_FRONTEND_DEPLOY_HOOK` | Renderフロントエンドのデプロイフック |

### Variables (Settings > Secrets and variables > Actions)

| Variable | 説明 |
|----------|------|
| `VITE_API_URL` | バックエンドURL（デフォルト: `https://llm-mermaid-chat-backend.onrender.com`） |

### ワークフロー

- **ci.yml**: PR/pushでlint, typecheck, test実行
- **deploy.yml**: mainへのpushでDockerイメージビルド、マイグレーション、Renderデプロイ

## 環境変数リファレンス

### ローカル開発 (backend/.env)

| 変数 | 必須 | 説明 |
|-----|-----|------|
| DATABASE_URL | Yes | `postgresql+asyncpg://...@localhost:5433/...` |
| OPENAI_API_KEY | Yes | OpenAI APIキー |
| USE_MOCK | No | `true` でモックモード |

### 本番 (Render)

| 変数 | 必須 | 説明 |
|-----|-----|------|
| DATABASE_URL | Yes | Neon PostgreSQL接続URL |
| OPENAI_API_KEY | Yes | OpenAI APIキー |
| USE_MOCK | No | `false` (本番) |
| PORT | No | 10000 (Render標準) |
| CORS_ORIGINS | No | フロントエンドURL |
