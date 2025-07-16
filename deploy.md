# デプロイ設定ガイド

## 🚀 デプロイ方法

### 1. Vercel (推奨)

#### フロントエンド
```bash
# Vercelにデプロイ
cd frontend
npx vercel

# 環境変数を設定
npx vercel env add NEXT_PUBLIC_API_URL
# 値: https://your-backend-url.vercel.app/api
```

#### バックエンド
```bash
# Vercelにデプロイ
cd backend
npx vercel

# 環境変数を設定
npx vercel env add DATABASE_URL
npx vercel env add JWT_SECRET
npx vercel env add STRIPE_SECRET_KEY
```

### 2. Netlify

#### フロントエンド
```bash
# Netlify CLIでデプロイ
cd frontend
npx netlify deploy --prod --dir=.next
```

#### バックエンド
Railway、Heroku、またはVercelを使用してバックエンドをデプロイ

### 3. Railway (バックエンド推奨)

```bash
# Railway CLIでデプロイ
cd backend
npx railway login
npx railway init
npx railway up
```

### 4. Heroku

```bash
# Herokuアプリを作成
heroku create your-app-name-backend
heroku create your-app-name-frontend

# バックエンドをデプロイ
git subtree push --prefix backend heroku-backend main

# フロントエンドをデプロイ
git subtree push --prefix frontend heroku-frontend main
```

## 🔧 必要な環境変数

### フロントエンド
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### バックエンド
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🗄️ データベース設定

### Supabase (推奨)
1. [Supabase](https://supabase.com)でプロジェクト作成
2. DATABASE_URLを取得
3. `npx prisma db push`でスキーマを適用

### PlanetScale
1. [PlanetScale](https://planetscale.com)でデータベース作成
2. 接続文字列を取得
3. `npx prisma db push`でスキーマを適用

### Railway PostgreSQL
1. Railwayでデータベースを追加
2. 接続文字列を取得
3. `npx prisma db push`でスキーマを適用

## 📦 ビルド最適化

### Next.js設定
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  experimental: {
    appDir: false,
  },
  output: 'standalone', // Docker用
}

module.exports = nextConfig
```

### TypeScript設定
```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "strict": false,
    "noUncheckedIndexedAccess": false
  }
}
```

## 🔒 セキュリティ設定

### CORS設定
```javascript
// backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true,
}));
```

### 環境変数の暗号化
```bash
# 本番環境では必ず強力なシークレットを使用
JWT_SECRET=$(openssl rand -base64 32)
```

## 🚨 トラブルシューティング

### よくあるエラー

1. **next: command not found**
   ```bash
   # package.jsonのbuildスクリプトを確認
   "scripts": {
     "build": "next build"
   }
   ```

2. **モジュールが見つからない**
   ```bash
   npm install
   npx prisma generate
   ```

3. **データベース接続エラー**
   ```bash
   # DATABASE_URLが正しく設定されているか確認
   echo $DATABASE_URL
   ```

4. **ビルドタイムアウト**
   ```bash
   # メモリ制限を増やす
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

## 📈 パフォーマンス最適化

### 画像最適化
```javascript
// next.config.js
module.exports = {
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-cloud-name/',
  },
}
```

### バンドルサイズ最適化
```bash
# 不要な依存関係を削除
npm install --production
```

## 🌐 CDN設定

### Cloudflareを使用
1. ドメインをCloudflareに設定
2. キャッシュルールを設定
3. SSL証明書を有効化

### 静的ファイル配信
```javascript
// next.config.js
module.exports = {
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.your-domain.com' : '',
}
```