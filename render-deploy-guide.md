# 🚀 Renderバックエンドデプロイガイド

## ステップ1: Renderアカウント作成とサービス設定

### 1️⃣ Renderアカウント作成
1. **https://render.com** にアクセス
2. **「Get Started」**をクリック
3. **「Continue with GitHub」**でログイン
4. 必要な権限を許可

### 2️⃣ Web Service作成
1. Renderダッシュボードで**「New +」**→**「Web Service」**
2. **「Build and deploy from a Git repository」**を選択
3. **「Connect」**をクリック
4. **`HayamiTakanari/influencer-marketing-tool`**を選択
5. **「Connect」**をクリック

### 3️⃣ サービス設定
以下の設定を行ってください：

```
Name: influencer-backend
Environment: Node
Region: Singapore (または Tokyo)
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: node simple-backend.js
```

### 4️⃣ 環境変数設定
「Environment」セクションで以下を追加：

```
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key-here-make-it-long-and-secure
PORT=10000
```

## ステップ2: PostgreSQLデータベース作成

### 1️⃣ PostgreSQL作成
1. Renderダッシュボードで**「New +」**→**「PostgreSQL」**
2. 以下の設定：
   ```
   Name: influencer-db
   Database: influencer_db
   User: influencer_user
   Region: Singapore (バックエンドと同じ)
   PostgreSQL Version: 15
   Plan: Free
   ```

### 2️⃣ データベース接続情報取得
1. 作成したPostgreSQLサービスをクリック
2. **「Connections」**タブで**「Internal Database URL」**をコピー

### 3️⃣ バックエンドに環境変数追加
バックエンドサービスの環境変数に追加：
```
DATABASE_URL=<コピーしたInternal Database URL>
```

## ステップ3: デプロイ実行

### 1️⃣ デプロイ開始
1. **「Create Web Service」**をクリック
2. デプロイが開始されます（5-10分程度）

### 2️⃣ デプロイ状況確認
- **「Logs」**タブでデプロイログを確認
- **「Events」**タブでイベント履歴を確認

### 3️⃣ 成功時の確認
デプロイ完了後、以下のURLでヘルスチェック：
```
https://your-app-name.onrender.com/health
```

## ステップ4: Vercelの環境変数更新

### 1️⃣ Vercelダッシュボードで設定
1. **https://vercel.com** にアクセス
2. **`influencer-marketing-tool`**プロジェクトを選択
3. **「Settings」**→**「Environment Variables」**

### 2️⃣ 環境変数更新
以下の値を更新：
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_SOCKET_URL=wss://your-backend-url.onrender.com
```

### 3️⃣ 再デプロイ
1. **「Deployments」**タブ
2. **「Redeploy」**をクリック

## ステップ5: 完了後のテスト

### 1️⃣ API動作確認
```
curl https://your-backend-url.onrender.com/health
```

### 2️⃣ フロントエンド動作確認
1. https://influencer-marketing-tool.vercel.app にアクセス
2. ログイン機能をテスト
3. インフルエンサー検索をテスト

## 📋 完了後のURL構成

- **フロントエンド**: https://influencer-marketing-tool.vercel.app
- **バックエンドAPI**: https://influencer-backend.onrender.com
- **ヘルスチェック**: https://influencer-backend.onrender.com/health
- **ログイン**: https://influencer-backend.onrender.com/api/auth/login

## ⚠️ 重要な注意事項

### 無料プランの制限
- **Render**: 月間750時間、15分間のアイドル後スリープ
- **PostgreSQL**: 1GB容量、90日後削除

### 初回リクエスト時の注意
- スリープ状態から復帰に30秒程度かかる場合があります
- 初回アクセス時は時間がかかることがあります

### セキュリティ
- JWT_SECRETは必ず変更してください
- 本番環境では強力なパスワードを使用してください

## 🔧 トラブルシューティング

### ビルドエラー
1. **「Logs」**タブでエラー内容を確認
2. `backend`フォルダ内の依存関係を確認
3. `package.json`の設定を確認

### 接続エラー
1. データベースURLが正しいか確認
2. 環境変数の設定を確認
3. CORSの設定を確認

---

**次のステップ**: 上記の手順に従って、Renderでバックエンドをデプロイしてください！