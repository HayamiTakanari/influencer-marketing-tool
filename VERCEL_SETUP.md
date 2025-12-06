# Vercel + Supabase セットアップガイド

## 概要

このプロジェクトは **Vercel** と **Supabase** だけで完結する構成に移行しました。

```
Vercel          ← Next.js (フロントエンド + API Routes)
  ├── /pages    ← フロントエンド
  └── /api      ← バックエンド（API ハンドラ）
       ├── /auth
       ├── /projects
       ├── /profiles
       └── ...

Supabase        ← PostgreSQL（データベース）
  └── Prisma で接続
```

---

## Vercel 環境変数設定

### 必須変数

Vercel ダッシュボード → Project Settings → Environment Variables に以下を設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | **必須** - Supabase PostgreSQL 接続 URL（プール接続） | `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | **必須** - Supabase 直接接続 URL（マイグレーション用） | `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | **必須** - JWT トークン署名用秘密鍵 | `your-super-secret-key-min-32-chars` |
| `JWT_REFRESH_SECRET` | **必須** - リフレッシュトークン署名用 | `your-refresh-secret-key-min-32-chars` |
| `NEXT_PUBLIC_API_URL` | **必須** - API ベース URL（フロントエンド用） | `https://influencer-marketing-tool-smoky.vercel.app/api` |
| `STRIPE_SECRET_KEY` | Stripe 秘密キー（本番） | `sk_live_xxxxxxxxxxxxx` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー（本番） | `pk_live_xxxxxxxxxxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary クラウド名 | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API キー | `xxxxxxxxxxxxx` |
| `CLOUDINARY_API_SECRET` | Cloudinary API シークレット | `xxxxxxxxxxxxx` |

---

## Supabase 接続 URL の取得

### 1. Supabase ダッシュボードにログイン
```
https://app.supabase.com
```

### 2. プロジェクト選択 → Settings → Database

### 3. Connection Pooling を有効化
- URI（プール接続）をコピー
- これを `DATABASE_URL` に設定

### 4. 直接接続 URL もコピー
- URI（直接接続）をコピー
- これを `DIRECT_URL` に設定

**例：**
```
DATABASE_URL=postgresql://postgres.abc123:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.abc123:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

---

## ローカル開発環境の設定

### 1. `.env` ファイルを編集

```bash
# ローカル用 DATABASE_URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/influencer_test"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/influencer_test"

# JWT 秘密鍵（開発用）
JWT_SECRET="dev-secret-key-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"

# API URL（ローカル開発）
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### 2. Prisma Client 生成

```bash
# ルートディレクトリから
pnpm prisma:generate
```

### 3. ローカルサーバ起動

```bash
pnpm dev
```

---

## Vercel デプロイ手順

### 1. 環境変数を設定
- Vercel ダッシュボード → Settings → Environment Variables
- 上記の必須変数をすべて設定

### 2. Git に push
```bash
git add .
git commit -m "feat: implement Vercel serverless API"
git push origin main
```

### 3. Vercel が自動デプロイ
- GitHub との連携により自動ビルド
- `build` script が実行：`prisma generate && next build`

### 4. デプロイ完了確認
```bash
# ヘルスチェック
curl https://your-app.vercel.app/api/health

# ログイン確認
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## トラブルシューティング

### Prisma Client が見つからない

```bash
# ローカルで再生成
pnpm prisma:generate

# または Vercel で build ログを確認
vercel logs --name influencer-marketing-tool-smoky
```

### DATABASE_URL エラー

```
Error: Could not connect to any servers
```

- Supabase が運用中か確認
- CONNECTION_LIMIT が正しいか確認
- Vercel IP ホワイトリストを確認（Supabase で設定）

### JWT エラー

```
JsonWebTokenError: invalid signature
```

- `JWT_SECRET` が Vercel と `.env` で一致しているか確認
- 本番環境では必ず強力なシークレットキーを使用

---

## API ハンドラ構造

```
apps/web/src/pages/api/
├── health.ts                 # ヘルスチェック
├── auth/
│   ├── login.ts              # ログイン
│   ├── register.ts           # 登録
│   └── refresh.ts            # トークンリフレッシュ
├── projects/
│   ├── index.ts              # プロジェクト一覧・作成
│   └── [id].ts               # プロジェクト詳細
├── profiles/
│   └── index.ts              # プロフィール
├── payments/
│   └── index.ts              # 支払い
└── ...
```

---

## 移行完了チェックリスト

- [ ] Supabase プロジェクト作成
- [ ] Connection Pooling 有効化
- [ ] DATABASE_URL と DIRECT_URL をコピー
- [ ] Vercel 環境変数をすべて設定
- [ ] ローカルで `pnpm dev` で動作確認
- [ ] Git に push
- [ ] Vercel 自動デプロイ確認
- [ ] `/api/health` にアクセス確認
- [ ] `/api/auth/login` でテスト

---

## 本番環境注意事項

⚠️ **必ず実施してください：**

1. JWT_SECRET は強力なランダム文字列を使用
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. データベース接続は Connection Pooling を使用（6543 ポート）

3. Stripe キーは本番用に切り替え

4. .env ファイルをコミットしない（`.gitignore` に含まれているか確認）

---

**作成日:** 2024-12-06
**バージョン:** 1.0
**対応:** Vercel + Supabase
