# インフルエンサーマーケティングツール - ローカル起動ガイド

## 🚀 クイックスタート

### 1. データベースの準備

PostgreSQLがインストールされていることを確認し、データベースを作成：

```bash
createdb influencer_marketing
```

### 2. バックエンドの起動

```bash
cd backend

# 環境変数ファイルを作成
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/influencer_marketing"
JWT_SECRET="your-secret-key-12345"
PORT=5002
FRONTEND_URL=http://localhost:3000' > .env

# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma generate
npx prisma db push

# サーバー起動
npm run dev
```

### 3. フロントエンドの起動（新しいターミナルで）

```bash
cd frontend

# 環境変数ファイルを作成
echo 'NEXT_PUBLIC_API_URL=http://localhost:5002/api' > .env.local

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

### 4. アプリケーションにアクセス

ブラウザで http://localhost:3000 を開く

## 📝 初回利用の流れ

1. **新規登録**: 「新規登録」ボタンからアカウント作成
2. **ロール選択**: インフルエンサー or クライアントを選択
3. **プロフィール設定**: 初回ログイン後、プロフィールを完成させる

## ⚠️ トラブルシューティング

### PostgreSQLエラーの場合
- PostgreSQLが起動しているか確認: `brew services list` (Mac)
- ユーザー名/パスワードを環境に合わせて変更

### ポート競合の場合
- バックエンド: .envでPORTを変更
- フロントエンド: package.jsonでポートを変更

### 依存関係エラーの場合
```bash
rm -rf node_modules package-lock.json
npm install
```

