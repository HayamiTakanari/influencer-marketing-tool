# Influencer Marketing Tool - 要件定義

## プロジェクト概要

インフルエンサーマーケティングプラットフォーム。企業とインフルエンサーを繋ぎ、プロジェクト管理、契約管理、報酬管理を統合的に行うシステム。

## 対象ユーザー

- **企業（Company）**: インフルエンサー案件を発注・管理する企業
- **インフルエンサー（Influencer）**: 案件を受注・納品する個人インフルエンサー
- **管理者（Admin）**: システム全体を管理するユーザー

## 技術スタック

### フロントエンド
- **Framework**: Next.js (TypeScript)
- **UI Library**: React
- **State Management**: TBD
- **Styling**: TBD

### バックエンド
- **Runtime**: Node.js
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

### インフラストラクチャ
- **Hosting**: Vercel (フロントエンド), Render (バックエンド)
- **Database Hosting**: Supabase (PostgreSQL)
  - **リージョン**: ap-northeast-1（東京）
  - **Connection Pooling**: 有効（Transaction Mode via pgbouncer）
  - **Direct URL**: マイグレーション用に別途設定

## 主要機能

### 認証・プロフィール
- ユーザー登録・ログイン（メール/OAuth）
- ロール別プロフィール管理
- インフルエンサー情報（フォロワー数、SNS連携）

### プロジェクト管理
- 企業による案件作成・編集
- 案件への応募・提案機能
- プロジェクトステータス管理

### コミュニケーション
- プロジェクト内チャット機能
- メッセージング機能
- 通知システム

### 契約・支払い
- NDA（秘密保持契約）の作成・署名
- 報酬支払い管理
- インボイス管理

### 分析・レポート
- パフォーマンス分析
- ダッシュボード
- 統計データの可視化

### SNS連携
- Instagram連携
- TikTok連携
- Twitter/X連携
- YouTube連携

## セキュリティ要件

- XSS対策
- CSRF対策
- SQL Injection対策
- レート制限
- IP ブラックリスト機能
- セキュリティアラート

## パフォーマンス要件

- ページロード時間: 3秒以内
- API レスポンス時間: 500ms以内
- 同時接続ユーザー対応: TBD

## 開発ルール

### 基本開発規則
- TypeScript を使用した型安全な開発
- コンポーネント単位での開発
- API エンドポイントの適切な設計
- エラーハンドリングの統一
- ログ機能の実装

### データベース・ORM運用規則（重要）

#### Supabase 活用ルール
1. **スキーマ管理**
   - Prismaスキーマはデータベースの単一の真実の源とする
   - スキーマ定義時点でSupabase側に反映することを前提に設計する
   - 「コメントアウト」によるスキーマとDB不一致は本番環境では許容しない

2. **マイグレーション**
   - 新規フィールド追加時は必ず Supabase に列を追加する
   - 開発環境でテスト後、本番環境に適用する流れを標準化
   - スキーマ変更→マイグレーション実行→Prismaクライアント再生成のプロセスを厳守

3. **接続設定**
   - `DATABASE_URL`: アプリケーション実行時（Connection Pooling使用）
   - `DIRECT_URL`: Prismaマイグレーション時（直接接続使用）
   - 両者を混同しないこと

4. **Prisma運用**
   ```bash
   # スキーマ変更後のマイグレーション実行（推奨）
   npx prisma migrate dev --name <migration-name>

   # または既存データベースとスキーマを同期
   npx prisma db push

   # クライアント再生成（必須）
   npx prisma generate
   ```

5. **禁止事項**
   - ❌ スキーマに定義したフィールドをコメントアウトしたまま放置
   - ❌ Prismaスキーマとデータベースの不整合を解決しないまま本番環境へ
   - ❌ 手作業SQLのみでカラム追加（Prismaスキーマと同期させる必須）

#### リリース前チェックリスト
- [ ] Prisma スキーマが Supabase データベースと完全に同期
- [ ] すべてのマイグレーションが実行済み
- [ ] Prisma クライアントが最新版に再生成済み
- [ ] ローカル環境で完全テスト実施
- [ ] 本番環境への移行手順を文書化

## 今後の拡張予定

- TBD

---

**最終更新**: 2025-11-30
**作成者**: System
