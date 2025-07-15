# インフルエンサー・マーケティング・ツール セットアップガイド

## 概要

このプロジェクトは、インフルエンサーとクライアントをマッチングするためのマーケティングプラットフォームです。

## 主な機能

- **インフルエンサー検索とフィルタリング**: カテゴリー、フォロワー数、地域、価格帯などで検索
- **プロフィール管理**: インフルエンサーのプロフィール、SNSアカウント、ポートフォリオ管理
- **チャット機能**: リアルタイムメッセージング（Socket.io）
- **Stripe決済統合**: 安全な支払い処理
- **SNS API連携**: Twitter、YouTube、Instagram APIとの統合

## 技術スタック

### バックエンド
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (リアルタイムチャット)
- Stripe (決済処理)
- Cloudinary (画像管理)
- JWT認証

### フロントエンド
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Query (サーバーステート管理)
- Zustand (クライアントステート管理)
- Socket.io Client

## セットアップ手順

### 1. 前提条件

- Node.js 18以上
- PostgreSQL 14以上
- pnpm または npm

### 2. データベースセットアップ

```bash
# PostgreSQLを起動
brew services start postgresql

# データベースを作成
createdb influencer_marketing
```

### 3. バックエンドセットアップ

```bash
cd backend

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env

# 必要なAPIキーを .env ファイルに設定
# - DATABASE_URL
# - JWT_SECRET
# - STRIPE_SECRET_KEY
# - CLOUDINARY_*
# - TWITTER_API_*
# - YOUTUBE_API_KEY

# Prismaマイグレーション
npx prisma migrate dev --name init

# Prismaクライアントを生成
npx prisma generate

# 開発サーバーを起動
npm run dev
```

### 4. フロントエンドセットアップ

```bash
cd frontend

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local

# 必要な環境変数を設定
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 開発サーバーを起動
npm run dev
```

## 必要なAPIキーの取得

### 1. Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com/)でアカウントを作成
2. 「開発者」 → 「APIキー」から取得
3. Webhookエンドポイントを設定（`/api/payments/webhook`）

### 2. Cloudinary

1. [Cloudinary](https://cloudinary.com/)でアカウントを作成
2. ダッシュボードからAPI情報を取得

### 3. Twitter API

1. [Twitter Developer Portal](https://developer.twitter.com/)でアプリを作成
2. API Keys and Tokensから認証情報を取得

### 4. YouTube API

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. YouTube Data API v3を有効化
3. APIキーを作成

### 5. Instagram Basic Display API

1. [Facebook for Developers](https://developers.facebook.com/)でアプリを作成
2. Instagram Basic Display APIを設定
3. OAuth認証フローを実装

## データベーススキーマ

### 主要なテーブル

- `User`: ユーザー認証情報
- `Client`: クライアント情報
- `Influencer`: インフルエンサー情報
- `SocialAccount`: SNSアカウント情報
- `Portfolio`: ポートフォリオ作品
- `Project`: プロジェクト（案件）
- `Message`: チャットメッセージ
- `Transaction`: 決済情報

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録

### インフルエンサー検索
- `GET /api/influencers/search` - 検索とフィルタリング
- `GET /api/influencers/:id` - 詳細情報取得
- `GET /api/influencers/categories` - カテゴリー一覧
- `GET /api/influencers/prefectures` - 都道府県一覧

### プロフィール管理
- `GET /api/profile/me` - 自分のプロフィール取得
- `PUT /api/profile/me` - プロフィール更新
- `POST /api/profile/social-accounts` - SNSアカウント追加
- `POST /api/profile/portfolio` - ポートフォリオ追加

### チャット
- `GET /api/chat/chats` - チャット一覧
- `GET /api/chat/messages/:projectId` - メッセージ取得
- `POST /api/chat/messages` - メッセージ送信

### 決済
- `POST /api/payments/create-payment-intent` - 支払い意図作成
- `POST /api/payments/confirm-payment` - 支払い確認
- `GET /api/payments/history` - 支払い履歴

### SNS連携
- `POST /api/sns/sync/:socialAccountId` - アカウント同期
- `GET /api/sns/sync-status` - 同期状況確認

## 開発時の注意点

### セキュリティ

- 全てのAPIエンドポイントにJWT認証を実装
- 入力値のバリデーション（Zod）
- Rate limiting
- CORS設定

### リアルタイム機能

- Socket.ioを使用したリアルタイムチャット
- タイピングインジケーター
- オンライン状態表示

### 決済処理

- Stripe Elements使用
- Webhook処理
- 返金機能

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - PostgreSQLが起動しているか確認
   - DATABASE_URLが正しいか確認

2. **Stripe Webhookエラー**
   - ngrokなどを使用してローカル環境を公開
   - Webhook署名の検証

3. **SNS API認証エラー**
   - APIキーの有効期限を確認
   - 認証方法の見直し

## 本番環境デプロイ

### 必要な環境変数

- すべてのAPIキー
- データベースURL
- Stripe本番キー
- CORS設定

### 推奨プラットフォーム

- **バックエンド**: Railway, Render, Heroku
- **フロントエンド**: Vercel, Netlify
- **データベース**: Railway PostgreSQL, Supabase

## ライセンス

このプロジェクトは個人・商用利用が可能です。

## サポート

問題や質問がある場合は、GitHubのIssuesまたはプルリクエストでお知らせください。