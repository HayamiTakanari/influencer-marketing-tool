# デプロイメントガイド

## 現在の状況
このツールは現在ローカル環境でのみ動作しています。サーバーへのデプロイには以下の作業が必要です。

## デプロイオプション

### オプション1: Vercel + Supabase（推奨）
Next.jsフロントエンドをVercelに、データベースをSupabaseにデプロイ

#### 必要な作業：
1. **Vercelアカウント作成**
   - https://vercel.com でアカウント作成
   - GitHubと連携

2. **Supabaseアカウント作成**
   - https://supabase.com でアカウント作成
   - 新しいプロジェクト作成

3. **環境変数設定**
   ```
   DATABASE_URL=<Supabaseのデータベース接続URL>
   JWT_SECRET=<ランダムな秘密鍵>
   STRIPE_SECRET_KEY=<Stripeの秘密鍵>
   ```

4. **デプロイコマンド**
   ```bash
   # Vercel CLIインストール
   npm i -g vercel
   
   # デプロイ
   vercel
   ```

### オプション2: Heroku
フルスタックアプリケーションをHerokuにデプロイ

#### 必要な作業：
1. **Herokuアカウント作成**
   - https://heroku.com でアカウント作成

2. **Heroku CLIインストール**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

3. **アプリケーション作成**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:mini
   ```

4. **デプロイ**
   ```bash
   git push heroku main
   ```

### オプション3: AWS/GCP/Azure
エンタープライズ向けのクラウドプラットフォーム

## 現在の制限事項

1. **スタンドアロンHTMLファイル**
   - 現在作成されているHTMLファイルは、Next.jsとは独立したスタンドアロンファイルです
   - これらはローカルでのテスト用に作成されました

2. **データベース接続**
   - 本番環境用のデータベース設定が必要です
   - 現在はモックデータを使用しています

3. **認証システム**
   - 本番環境では実際のJWT認証が必要です
   - 現在はテスト用の簡易認証です

## 推奨される次のステップ

1. **デプロイ方法の選択**
   - どのプラットフォームを使用するか決定してください

2. **必要な情報の提供**
   - デプロイ先のプラットフォーム
   - ドメイン名（もしあれば）
   - 予算の範囲

3. **本番環境の準備**
   - 環境変数の設定
   - データベースの移行
   - SSL証明書の設定

## ローカルでの動作確認

現在、以下のコマンドでローカル環境で全機能をテストできます：

```bash
# バックエンドサーバーの起動
cd backend
node simple-backend.js

# 別のターミナルでフロントエンドの起動（Next.js版）
cd frontend
npm run dev
```

スタンドアロンHTMLファイルは直接ブラウザで開いて使用できます。

## 質問

どのデプロイオプションを選択されますか？また、既存のサーバーやドメインはお持ちですか？