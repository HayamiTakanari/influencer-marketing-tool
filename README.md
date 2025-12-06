# インフルエンサーマーケティングツール - Production-Ready Monorepo

## 概要
クライアントの要望に合致するインフルエンサーを効率的に見つけ、キャスティングを支援するプラットフォーム

**Status:** Production-Ready | **Setup:** pnpm Monorepo | **Infrastructure:** Docker & Kubernetes Ready

## 主な機能
- インフルエンサー検索・マッチング
- インフルエンサー管理
- チャット・案件管理
- Stripe決済
- SNS API連携
- チームアカウント

## 最新の改善点 (Production Refactoring)

### ✅ Monorepo Architecture
- **pnpm Workspaces** を使用した統一的なパッケージ管理
- **apps/** フォルダで API とフロントエンドを分離
- **packages/** フォルダで共有コード (types, utils, api-client) を一元管理

### ✅ Docker & Orchestration
- マルチステージ Docker ビルド (本番環境向け最適化)
- `docker-compose.yml` (本番環境)
- `docker-compose.dev.yml` (開発環境)
- Nginx リバースプロキシ設定済み
- ヘルスチェック & 自動再起動機能

### ✅ CI/CD Pipeline
- GitHub Actions ワークフロー
  - `test.yml` - テスト自動化
  - `lint.yml` - コード品質検査
  - `deploy.yml` - 自動デプロイ

### ✅ 包括的なドキュメント
- `docs/ARCHITECTURE.md` - プロジェクト構成
- `docs/DEVELOPMENT.md` - 開発ガイド
- `docs/DEPLOYMENT.md` - デプロイガイド
- `docs/API.md` - API リファレンス

### ✅ 開発効率化
- Makefile で一般的なコマンドをショートカット化
- pnpm workspace コマンドで複数パッケージを同時管理
- 統一された環境変数管理 (`.env.example`)

## 技術スタック
### バックエンド
- Node.js 18+ / TypeScript
- Express.js + Helmet + Rate Limiting
- Prisma ORM
- PostgreSQL (Supabase)
- Socket.io (WebSocket)
- JWT 認証 + OAuth2 (Google, Instagram, TikTok)
- Cloudinary (画像管理)
- Stripe (決済)

### フロントエンド
- Next.js 14 (Pages Router)
- React 18 / TypeScript
- Tailwind CSS
- Axios + API Client
- Custom Hooks

### 共有パッケージ
- `@influencer-tool/shared-types` - 型定義
- `@influencer-tool/shared-utils` - ユーティリティ
- `@influencer-tool/api-client` - HTTP クライアント

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0.0 以上
- pnpm 8.0.0 以上
- Docker & Docker Compose (推奨)

### セットアップ

1. **pnpm をインストール**
```bash
npm install -g pnpm@8
```

2. **リポジトリをクローン**
```bash
git clone https://github.com/yourusername/influencer-marketing-tool.git
cd influencer-marketing-tool
```

3. **依存関係をインストール**
```bash
pnpm install
```

4. **環境変数を設定**
```bash
cp .env.example .env
# .env を編集して、以下の値を設定
```

必須の環境変数:
```env
# Database (Supabase)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# その他の外部サービス
CLOUDINARY_CLOUD_NAME="xxx"
GOOGLE_CLIENT_ID="xxx"
SUPABASE_URL="https://xxx.supabase.co"
```

5. **開発を開始**

**オプション A: Docker で実行 (推奨)**
```bash
pnpm dev:docker
```
アクセス: http://localhost:3000 (フロントエンド)

**オプション B: ローカルで実行**
```bash
# 両方のサーバーを並列実行
pnpm dev

# または個別に実行
# ターミナル 1
pnpm api

# ターミナル 2
pnpm web
```
アクセス: http://localhost:3000 (フロントエンド) と http://localhost:3001 (API)

## 📚 ドキュメント

詳細なガイドについては `docs/` ディレクトリを参照してください:

| ドキュメント | 説明 |
|-----------|------|
| [docs/README.md](./docs/README.md) | ドキュメント概要 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | プロジェクト構成とアーキテクチャ |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 開発環境セットアップと開発ガイド |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | 本番環境へのデプロイ |
| [docs/API.md](./docs/API.md) | API エンドポイント リファレンス |

## 🛠 一般的なコマンド

### 開発
```bash
pnpm dev              # すべてのサービスを実行
pnpm api              # バックエンド API のみ
pnpm web              # フロントエンド Web のみ
pnpm dev:docker       # Docker で実行
```

### ビルド & デプロイ
```bash
pnpm build            # すべてをビルド
pnpm start:prod       # 本番環境を実行
pnpm start:prod:down  # サービスを停止
```

### 品質管理
```bash
pnpm test             # テストを実行
pnpm lint             # コード検査
pnpm typecheck        # TypeScript チェック
```

### データベース
```bash
pnpm prisma:migrate   # マイグレーション実行
pnpm prisma:studio    # Prisma Studio を開く
```

## 📁 プロジェクト構造

```
influencer-marketing-tool/
├── apps/
│   ├── api/              # Express.js バックエンド
│   └── web/              # Next.js フロントエンド
├── packages/
│   ├── shared-types/     # 共有型定義
│   ├── shared-utils/     # 共有ユーティリティ
│   └── api-client/       # HTTP クライアント
├── configs/              # Nginx 設定等
├── .github/workflows/    # GitHub Actions CI/CD
├── docs/                 # ドキュメント
├── docker-compose.yml    # 本番用 Compose
├── docker-compose.dev.yml # 開発用 Compose
├── Dockerfile.api        # API イメージ
├── Dockerfile.web        # Web イメージ
└── Makefile              # コマンド ショートカット
```

## 🔄 開発ワークフロー

1. フィーチャーブランチを作成
```bash
git checkout -b feature/feature-name
```

2. ローカルで開発
```bash
pnpm dev
```

3. コミット & プッシュ
```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/feature-name
```

4. Pull Request を作成
5. GitHub Actions が自動テスト & リント
6. レビュー後にマージ
7. 自動デプロイ

## ✅ Makefile ショートカット

便利なコマンドについては `Makefile` を参照:

```bash
make help             # すべてのコマンドを表示
make dev-docker       # Docker で開発開始
make build            # 本番ビルド
make start-prod       # 本番環境を実行
make test             # テスト実行
make lint             # コード検査
```

## データベース

このプロジェクトは **Supabase PostgreSQL** を使用しています。

詳細なセットアップ手順:
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabaseの初期設定
- [MIGRATION_TO_SUPABASE.md](./MIGRATION_TO_SUPABASE.md) - 移行チェックリスト

## プロジェクト構成

```
influencer-marketing-tool/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── controllers/ # ビジネスロジック
│   │   ├── routes/      # APIルート
│   │   ├── middleware/  # 認証・セキュリティ
│   │   ├── services/    # 外部API連携
│   │   ├── schemas/     # Zodバリデーション
│   │   └── utils/       # ユーティリティ
│   └── prisma/          # データベーススキーマ
│
└── frontend/            # Next.js アプリ
    ├── src/
    │   ├── pages/       # ページコンポーネント
    │   ├── components/  # 再利用可能なコンポーネント
    │   └── lib/         # ユーティリティ・API
    └── public/          # 静的ファイル
```

## セキュリティ機能

- ✅ Helmet によるセキュリティヘッダー
- ✅ Rate Limiting (認証: 5回/15分)
- ✅ XSS対策 (DOMPurify, sanitize-html)
- ✅ SQLインジェクション対策 (Prisma ORM)
- ✅ コマンドインジェクション対策
- ✅ CSRF対策
- ✅ JWT認証
- ✅ パスワードハッシュ化 (bcrypt)

## トラブルシューティング

### データベース接続エラー
```bash
# Supabase接続テスト
cd backend
node test-supabase-connection.js
```

### Prismaクライアントエラー
```bash
cd backend
npx prisma generate
npx prisma db push
```

### ポート競合エラー
```bash
# バックエンド: backend/src/index.ts の PORT を変更
# フロントエンド: 自動的に空きポートを使用
```