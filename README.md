# インフルエンサーマーケティングツール

## 概要
クライアントの要望に合致するインフルエンサーを効率的に見つけ、キャスティングを支援するプラットフォーム

## 主な機能
- インフルエンサー検索・マッチング
- インフルエンサー管理
- チャット・案件管理
- Stripe決済
- SNS API連携
- チームアカウント

## 技術スタック
### バックエンド
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL (Supabase)
- Socket.io
- JWT認証
- Helmet (セキュリティヘッダー)
- Rate Limiting
- Cloudinary (画像管理)
- Stripe (決済)

### フロントエンド
- Next.js 14 (Pages Router)
- TypeScript
- Tailwind CSS
- React Query
- Zustand

## セットアップ
1. 依存関係のインストール
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. 環境変数の設定
```bash
cp backend/.env.example backend/.env
# .envファイルを編集し、以下の環境変数を設定
```

必須の環境変数:
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="your-secret-key"

# Server
PORT=5002

# Stripe (オプション)
STRIPE_SECRET_KEY="sk_test_xxx"

# Cloudinary (オプション)
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Twitter API (オプション)
TWITTER_API_KEY="xxx"
TWITTER_API_SECRET="xxx"
```

3. データベースのセットアップ
```bash
cd backend
npx prisma generate
npx prisma db push
# または包括的なテストを実行
node comprehensive-db-test.js
```

4. 開発サーバーの起動
```bash
# バックエンド (ターミナル1)
cd backend
npm run dev

# フロントエンド (ターミナル2)
cd frontend
npm run dev
```

アクセス:
- フロントエンド: http://localhost:3000 (または空きポート)
- バックエンド: http://localhost:5002
- ヘルスチェック: http://localhost:5002/health

## 開発コマンド

### バックエンド
```bash
cd backend
npm run dev          # 開発サーバー起動
npm run build        # TypeScriptビルド
npm start            # 本番サーバー起動
npx prisma generate  # Prismaクライアント生成
npx prisma db push   # スキーマをDBに反映
```

### フロントエンド
```bash
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm start            # 本番サーバー起動
```

### テスト
```bash
cd backend
node comprehensive-db-test.js    # データベース接続テスト
node test-supabase-connection.js # Supabase接続確認
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