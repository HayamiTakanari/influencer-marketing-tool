# Supabase セットアップガイド

## 📌 概要
このプロジェクトではSupabase PostgreSQLをデータベースとして使用します。

## 🚀 Supabaseプロジェクト作成

### 1. Supabaseアカウント作成
1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ

### 2. 新規プロジェクト作成
1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力:
   - **Name**: `influencer-marketing-tool`
   - **Database Password**: 強力なパスワードを設定（保存してください）
   - **Region**: `Northeast Asia (Tokyo)` または近隣リージョン
   - **Pricing Plan**: `Free` または `Pro`

3. 「Create new project」をクリック（セットアップに2-3分かかります）

### 3. 接続情報の取得
1. プロジェクトダッシュボードで「Settings」→「Database」
2. 「Connection string」セクションで以下を確認:
   - **Connection pooling**: `Transaction` モード推奨
   - **URI**: `postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

## ⚙️ バックエンド設定

### 1. 環境変数の更新

`backend/.env` ファイルを以下のように更新:

```env
# Supabase Database URL (Transaction Mode - Prisma推奨)
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection URL (マイグレーション用)
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# その他の環境変数は変更なし
JWT_SECRET="your-secret-key-here"
PORT=5002
FRONTEND_URL="http://localhost:3000"
```

### 2. Prismaスキーマの更新

`backend/prisma/schema.prisma` を以下のように更新:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3. データベースマイグレーション

```bash
cd backend

# 依存関係のインストール
npm install

# Prismaクライアントの生成
npx prisma generate

# マイグレーションの実行
npx prisma migrate deploy

# または開発環境では
npx prisma db push
```

### 4. シードデータの投入（オプション）

```bash
npx prisma db seed
```

## 🔍 接続テスト

### テストスクリプトの実行

```bash
cd backend
node test-supabase-connection.js
```

成功すると以下のメッセージが表示されます:
```
✅ Supabase接続成功
Database version: PostgreSQL 15.x
```

## 📊 Supabase Studio（GUI管理ツール）

### データベースの確認

1. Supabaseダッシュボードで「Table Editor」をクリック
2. 作成されたテーブルを確認:
   - User
   - Client
   - Influencer
   - Project
   - SocialAccount
   - など

### SQLエディタの使用

1. 「SQL Editor」タブをクリック
2. カスタムクエリを実行可能

```sql
-- ユーザー数の確認
SELECT COUNT(*) FROM "User";

-- インフルエンサー一覧
SELECT * FROM "Influencer" LIMIT 10;
```

## 🔐 セキュリティ設定

### 1. Row Level Security (RLS)
Supabaseは自動的にRLSを有効化しますが、Prismaを使用する場合は無効化を推奨:

```sql
-- すべてのテーブルのRLSを無効化
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Influencer" DISABLE ROW LEVEL SECURITY;
-- 他のテーブルも同様
```

### 2. API設定
1. 「Settings」→「API」
2. 「service_role key」を確認（管理用、バックエンドでは不要）

## 📈 パフォーマンス最適化

### Connection Pooling設定
- **Transaction Mode**: Prismaと互換性あり（推奨）
- **Session Mode**: 一部機能に制限あり
- **Statement Mode**: 使用非推奨

### インデックスの追加（オプション）

```sql
-- よく使用されるクエリ用のインデックス
CREATE INDEX idx_influencer_categories ON "Influencer" USING GIN (categories);
CREATE INDEX idx_project_status ON "Project" (status);
CREATE INDEX idx_social_account_platform ON "SocialAccount" (platform);
```

## 🔄 既存データの移行（既存DBがある場合）

### 1. 既存データのエクスポート

```bash
# ローカルPostgreSQLからダンプ
pg_dump -h localhost -U postgres -d influencer_marketing > backup.sql
```

### 2. Supabaseへのインポート

```bash
# Supabaseに接続してインポート
psql "postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" < backup.sql
```

## ⚠️ トラブルシューティング

### エラー: "prepared statement already exists"
- **原因**: Connection Pooling (Transaction Mode) での制限
- **解決**: `DATABASE_URL` に `?pgbouncer=true` を追加

### エラー: "SSL connection required"
- **原因**: Supabaseは常にSSL接続を要求
- **解決**: 接続文字列に `?sslmode=require` を追加

### エラー: "too many connections"
- **原因**: 無料プランの接続数制限（60接続）
- **解決**: Connection Poolingを使用、または `connection_limit=1` を追加

### マイグレーションエラー
- **解決**: `DIRECT_URL` を使用してマイグレーション実行
```bash
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

## 📝 本番環境デプロイ時の注意

### 環境変数の設定
Render/Vercelなどのデプロイ先で以下を設定:

```env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres
```

### バックアップ設定
1. Supabaseダッシュボード→「Database」→「Backups」
2. 自動バックアップは毎日実施（Free: 7日間保持、Pro: 30日間保持）

## 🎯 次のステップ

1. ✅ Supabaseプロジェクト作成
2. ✅ 環境変数設定
3. ✅ マイグレーション実行
4. ✅ 接続テスト
5. 🚀 アプリケーション起動

```bash
# バックエンド起動
cd backend
npm run dev

# フロントエンド起動（別ターミナル）
cd frontend
npm run dev
```

## 📚 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
