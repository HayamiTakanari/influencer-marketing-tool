# Supabase マイグレーション運用ガイド

本番開発での Supabase と Prisma の適切な運用方法を定めるドキュメント。

## 概要

このプロジェクトは以下の構成で運用されます：

- **データベース**: Supabase PostgreSQL (ap-northeast-1 リージョン)
- **ORM**: Prisma
- **スキーマ管理**: Prismaスキーマが Single Source of Truth

## 重要な接続設定

### DATABASE_URL vs DIRECT_URL

```env
# アプリケーション実行時用（Connection Pooling）
DATABASE_URL="postgresql://...@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Prismaマイグレーション時用（直接接続）
DIRECT_URL="postgresql://...@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**なぜ分ける？**
- `DATABASE_URL`: アプリケーション実行時に接続プーリング経由で複数の同時接続を効率的に処理
- `DIRECT_URL`: マイグレーション実行時に直接接続（プーリング経由では DDL 実行が不安定）

## 新規フィールド追加の標準プロセス

### ステップ 1: Prismaスキーマを更新

```prisma
// prisma/schema.prisma
model User {
  id              String     @id @default(cuid())
  email           String     @unique
  // ... 既存フィールド ...

  // 新規フィールドを追加
  newColumn       String?    @default("default_value")
  newTimestamp    DateTime?
}
```

### ステップ 2: スキーマを Supabase に同期

```bash
# Option A: 推奨（マイグレーション履歴を記録）
npx prisma migrate dev --name <migration_name>

# Option B: 本番環境への追加（マイグレーションなし）
npx prisma db push
```

### ステップ 3: Prisma クライアント再生成

```bash
npx prisma generate
```

### ステップ 4: バックエンドサーバーを再起動

```bash
# 既存プロセスを終了
kill <PID>

# 新しいサーバーを起動
npm run dev
```

### ステップ 5: テスト

```bash
# ローカル環境で機能テスト実施
npm run test

# エンドポイントの動作確認
curl http://localhost:3001/api/health
```

## Supabase ダッシュボードでの確認

1. [Supabase ダッシュボード](https://app.supabase.com) にアクセス
2. プロジェクト選択
3. **SQL Editor** > 新規クエリ
4. 以下を実行して新規カラムを確認：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;
```

## 禁止事項（本番開発での重要ルール）

❌ **やってはいけないこと:**

1. スキーマに定義したフィールドをコメントアウトしたまま放置
   ```prisma
   // ❌ これはしてはいけない
   // newColumn String?
   ```

2. Supabase ダッシュボードで手作業カラム追加 ＆ Prismaスキーマは更新しない
   - 将来のマイグレーションで競合が発生

3. DATABASE_URL と DIRECT_URL を混同
   - アプリ実行時に DIRECT_URL を使用しない（パフォーマンス低下）

4. マイグレーション前にコードをデプロイ
   - 本番環境でスキーマエラーが発生する可能性

5. スキーマ変更後、Prisma クライアント再生成を忘れる
   - TypeScript型が古いままで型安全性が失われる

## トラブルシューティング

### エラー: "column does not exist in the current database"

**原因**: Prisma スキーマに定義されているが Supabase に無い列

**解決方法**:
```bash
npx prisma db push  # スキーマを同期
npx prisma generate # クライアント再生成
```

### エラー: "Drift detected"

**原因**: マイグレーション履歴とデータベーススキーマが不一致

**解決方法**:
```bash
# Option A: Supabase スキーマを現在の Prisma スキーマに同期
npx prisma db push

# Option B: マイグレーション履歴を Supabase スキーマと同期（データベースリセット）
npx prisma migrate reset  # ⚠️ 本番環境では実行禁止
```

### エラー: Connection refused at DIRECT_URL

**原因**: Supabase の直接接続URLが無効

**解決方法**:
1. Supabase ダッシュボード > Settings > Database > Connection string
2. `.env` の DIRECT_URL を最新に更新
3. 再度マイグレーション実行

## 本番環境への適用手順

1. 開発環境で完全テスト（ローカル）
2. マイグレーションコマンド実行
3. Prisma クライアント再生成
4. バックエンド再起動
5. 全 API エンドポイントをテスト
6. 本番環境に git push
7. CI/CD パイプラインが自動実行（マイグレーション + デプロイ）

## 参考リンク

- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/overview)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Connection Pooling with pgBouncer](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**最終更新**: 2025-11-30
**担当者**: System
**重要度**: ⚠️ 本番開発での必須ドキュメント
