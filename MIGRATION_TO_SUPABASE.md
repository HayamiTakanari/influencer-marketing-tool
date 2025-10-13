# Supabase移行手順ガイド

## 📋 移行チェックリスト

- [ ] 1. Supabaseプロジェクト作成
- [ ] 2. 環境変数設定
- [ ] 3. Prismaスキーマ更新
- [ ] 4. データベース接続テスト
- [ ] 5. マイグレーション実行
- [ ] 6. 既存データ移行（必要な場合）
- [ ] 7. アプリケーション動作確認

## 🚀 ステップ1: Supabaseプロジェクト作成

### 1-1. アカウント作成とプロジェクトセットアップ
```bash
# 1. https://supabase.com/ にアクセス
# 2. GitHubアカウントでサインアップ
# 3. 「New Project」をクリック
```

### 1-2. プロジェクト設定
```
Name: influencer-marketing-tool
Database Password: ********** (強力なパスワードを設定・保存)
Region: Northeast Asia (Tokyo)
Pricing Plan: Free または Pro
```

### 1-3. 接続情報の取得
1. プロジェクトダッシュボード→「Settings」→「Database」
2. 「Connection string」セクションで以下をコピー:
   - **Transaction mode**: `postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres`
   - **Direct connection**: `postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres`

## ⚙️ ステップ2: 環境変数設定

### 2-1. .envファイル作成

```bash
cd backend
cp .env.example .env
```

### 2-2. .envファイル編集

```env
# Supabase Database URL (Transaction Mode - Prisma推奨)
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection URL (マイグレーション用)
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# その他の設定（既存）
JWT_SECRET="your-secret-key-here"
PORT=5002
FRONTEND_URL="http://localhost:3000"
```

⚠️ **重要**: `[project-ref]` と `[YOUR-PASSWORD]` を実際の値に置き換えてください

## 🔧 ステップ3: Prismaスキーマ更新

既に更新済みです。確認：

```bash
cat backend/prisma/schema.prisma | head -10
```

以下が表示されればOK:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## ✅ ステップ4: データベース接続テスト

### 4-1. 依存関係のインストール

```bash
cd backend
npm install
```

### 4-2. Prismaクライアント生成

```bash
npx prisma generate
```

### 4-3. 接続テスト実行

```bash
node test-supabase-connection.js
```

**成功時の出力例:**
```
🔍 Supabase接続テスト開始...

1️⃣ データベース接続テスト
✅ Prisma接続成功

2️⃣ PostgreSQLバージョン確認
✅ Database version: PostgreSQL 15.x

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Supabase接続テスト完了
すべてのテストに成功しました！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4-4. エラーが発生した場合

#### エラー: "Can't reach database server"
```bash
# 確認事項
1. DATABASE_URLが正しいか確認
2. Supabaseプロジェクトが起動中か確認
3. パスワードに特殊文字が含まれる場合、URLエンコードされているか確認
```

#### エラー: "SSL connection required"
```bash
# 接続文字列に ?sslmode=require を追加
DATABASE_URL="...postgres?pgbouncer=true&connection_limit=1&sslmode=require"
```

## 🗄️ ステップ5: マイグレーション実行

### 5-1. マイグレーション（新規データベース）

```bash
# Direct URLを使用してマイグレーション
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

または

```bash
# 開発環境の場合（スキーマ同期）
npx prisma db push
```

### 5-2. 実行結果の確認

成功すると以下のメッセージが表示されます:
```
✔ Generated Prisma Client
✔ Migrations applied successfully
```

### 5-3. Supabase Studioで確認

1. Supabaseダッシュボード→「Table Editor」
2. 以下のテーブルが作成されていることを確認:
   - User
   - Client
   - Influencer
   - Project
   - SocialAccount
   - Portfolio
   - Message
   - Transaction
   - Notification
   - など（全26テーブル）

## 📦 ステップ6: 既存データ移行（オプション）

既存のPostgreSQLデータベースからデータを移行する場合:

### 6-1. 既存データのエクスポート

```bash
# ローカルPostgreSQLからダンプ
pg_dump -h localhost -U postgres -d influencer_marketing \
  --data-only \
  --no-owner \
  --no-privileges \
  > data_backup.sql
```

### 6-2. Supabaseへのインポート

```bash
# Supabaseに接続してインポート
psql "postgresql://postgres.[ref]:[pass]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" \
  < data_backup.sql
```

### 6-3. データ確認

```bash
# 接続テストスクリプトで確認
node test-supabase-connection.js
```

## 🎯 ステップ7: アプリケーション動作確認

### 7-1. バックエンド起動

```bash
cd backend
npm run dev
```

**起動成功時の出力:**
```
Server running on port 5002
Database connected successfully
```

### 7-2. フロントエンド起動（別ターミナル）

```bash
cd frontend
npm run dev
```

### 7-3. 動作確認項目

- [ ] ログイン機能
- [ ] ユーザー登録
- [ ] インフルエンサー検索
- [ ] プロフィール表示
- [ ] チャット機能
- [ ] プロジェクト作成

### 7-4. データベースクエリ確認

Prismaのログを有効にしてクエリを確認:

```bash
# backend/src/index.ts または該当ファイルで
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## 🔒 セキュリティ設定

### Row Level Security (RLS) 無効化

SupabaseはデフォルトでRLSを有効にしますが、Prismaを使用する場合は無効化を推奨:

```sql
-- Supabase SQL Editorで実行
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Influencer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialAccount" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ServicePricing" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BulkInquiry" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "InquiryResponse" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectSchedule" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SecurityStats" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "IPBlacklist" DISABLE ROW LEVEL SECURITY;
```

## 📈 パフォーマンス最適化

### インデックスの追加（オプション）

```sql
-- よく検索されるカラムにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_influencer_categories ON "Influencer" USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_project_status ON "Project" (status);
CREATE INDEX IF NOT EXISTS idx_project_client ON "Project" ("clientId");
CREATE INDEX IF NOT EXISTS idx_social_account_platform ON "SocialAccount" (platform);
CREATE INDEX IF NOT EXISTS idx_social_account_influencer ON "SocialAccount" ("influencerId");
CREATE INDEX IF NOT EXISTS idx_message_project ON "Message" ("projectId");
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification" ("userId", "isRead");
```

## 🚨 トラブルシューティング

### 問題1: "prepared statement already exists"

**原因**: Connection Pooling (Transaction Mode) での制限

**解決策**:
```env
# DATABASE_URLに pgbouncer=true を追加
DATABASE_URL="...postgres?pgbouncer=true&connection_limit=1"
```

### 問題2: "too many connections"

**原因**: 接続数上限（Free: 60接続）

**解決策**:
```env
# connection_limit を追加
DATABASE_URL="...postgres?pgbouncer=true&connection_limit=1"
```

### 問題3: マイグレーションが失敗する

**解決策**:
```bash
# DIRECT_URLを使用
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy

# または
npx prisma db push --accept-data-loss
```

### 問題4: RLS（Row Level Security）エラー

**解決策**:
```sql
-- Supabase SQL Editorで全テーブルのRLSを無効化
-- 上記「セキュリティ設定」セクションのSQLを実行
```

## ✨ 完了確認

すべてのステップが完了したら:

- [ ] ✅ Supabaseプロジェクトが稼働中
- [ ] ✅ データベース接続テスト成功
- [ ] ✅ マイグレーション完了（全テーブル作成）
- [ ] ✅ バックエンド起動成功
- [ ] ✅ フロントエンド起動成功
- [ ] ✅ 基本機能の動作確認完了

## 🎉 次のステップ

1. **本番環境デプロイ**: Render/Vercelに環境変数を設定
2. **バックアップ設定**: Supabaseの自動バックアップを確認
3. **モニタリング**: Supabaseダッシュボードでクエリパフォーマンスを監視

## 📚 参考リンク

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - 詳細設定ガイド
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)
