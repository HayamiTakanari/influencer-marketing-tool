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
- PostgreSQL
- Socket.io
- JWT認証

### フロントエンド
- Next.js 14 (App Router)
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
# .envファイルを編集し、必要な環境変数を設定
```

3. データベースのセットアップ
```bash
cd backend
npm run db:migrate
npm run db:seed
```

4. 開発サーバーの起動
```bash
npm run dev
```

## 開発コマンド
- `npm run dev` - バックエンドとフロントエンドを同時起動
- `npm run dev:backend` - バックエンドのみ起動
- `npm run dev:frontend` - フロントエンドのみ起動
- `npm run build` - プロダクションビルド
- `npm run lint` - Lintチェック
- `npm run typecheck` - 型チェック