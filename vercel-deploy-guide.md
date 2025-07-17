# 🚀 Vercelデプロイガイド

## ステップ1: Vercelアカウントの作成とプロジェクトインポート

### 1️⃣ Vercelにアクセス
1. https://vercel.com にアクセス
2. 「Continue with GitHub」をクリック
3. GitHubアカウントでログイン

### 2️⃣ プロジェクトのインポート
1. Vercelダッシュボードで「Add New...」→「Project」
2. 「Import Git Repository」を選択
3. `HayamiTakanari/influencer-marketing-tool` を探して「Import」をクリック

### 3️⃣ プロジェクト設定
以下の設定を行ってください：

**基本設定:**
- **Project Name**: `influencer-marketing-tool`
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend`

**ビルド設定:**
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4️⃣ 環境変数の設定
「Environment Variables」セクションで以下を追加：

```
NEXT_PUBLIC_API_URL=http://localhost:5002
NEXT_PUBLIC_SOCKET_URL=ws://localhost:5002
```

## ステップ2: バックエンドのデプロイ（Render）

### 1️⃣ Renderアカウント作成
1. https://render.com にアクセス
2. GitHubアカウントでサインアップ

### 2️⃣ Web Service作成
1. 「New +」→「Web Service」
2. GitHubリポジトリを接続
3. `HayamiTakanari/influencer-marketing-tool` を選択

### 3️⃣ サービス設定
```
Name: influencer-backend
Environment: Node
Region: Singapore
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: node simple-backend.js
```

### 4️⃣ 環境変数設定
```
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key-here
PORT=10000
```

## ステップ3: データベースの設定

### 1️⃣ Render PostgreSQL
1. Renderダッシュボードで「New +」→「PostgreSQL」
2. 無料プランを選択
3. データベース名: `influencer-db`

### 2️⃣ 環境変数更新
バックエンドサービスに以下を追加：
```
DATABASE_URL=<RenderのPostgreSQLのInternal Database URL>
```

## ステップ4: フロントエンドの環境変数更新

Vercelプロジェクトの環境変数を更新：
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_SOCKET_URL=wss://your-backend-url.onrender.com
```

## ステップ5: HTMLファイルの公開

### GitHub Pages（オプション）
1. GitHubリポジトリの Settings
2. Pages セクション
3. Source: Deploy from a branch
4. Branch: main, フォルダ: / (root)

これで以下のURLでHTMLファイルにアクセス可能：
- `https://hayamitakanari.github.io/influencer-marketing-tool/web-app.html`
- `https://hayamitakanari.github.io/influencer-marketing-tool/ai-powered-web-app.html`
- など...

## 🎯 完了後のURL例

- **Next.jsアプリ**: `https://influencer-marketing-tool.vercel.app`
- **API**: `https://influencer-backend.onrender.com`
- **HTMLファイル**: `https://hayamitakanari.github.io/influencer-marketing-tool/`

## ⚠️ 重要な注意事項

1. **無料プランの制限**
   - Vercel: 月間100GB転送量
   - Render: 月間750時間、15分間のスリープ

2. **デプロイ時間**
   - 初回デプロイ: 5-10分
   - 以降のデプロイ: 1-3分

3. **データベース**
   - 開発用データのみ
   - 本番運用時は有料プランを検討

## 🔧 トラブルシューティング

### ビルドエラーの場合
1. Vercelのビルドログを確認
2. `frontend`フォルダ内で `npm run build` をローカルでテスト
3. 依存関係の問題を解決

### API接続エラーの場合
1. バックエンドが正常に起動しているか確認
2. 環境変数のURLが正しいか確認
3. CORSの設定を確認

---

**次のステップ**: 上記の手順に従って、まずVercelでフロントエンドをデプロイしてください！