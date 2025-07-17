# 🚀 デプロイメント手順

## ステップ1: GitHubリポジトリの作成

1. GitHubにログインして新しいリポジトリを作成：
   - https://github.com/new にアクセス
   - リポジトリ名: `influencer-marketing-tool`
   - Public/Privateを選択
   - 「Create repository」をクリック

2. ローカルリポジトリをGitHubに接続：
```bash
cd /Users/takanari/influencer-marketing-tool
git add .
git commit -m "Initial commit: Complete influencer marketing tool"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/influencer-marketing-tool.git
git push -u origin main
```

## ステップ2: 無料デプロイオプション

### オプションA: Vercel + Render（推奨・完全無料）

#### フロントエンド（Vercel）
1. https://vercel.com にアクセス
2. 「Import Git Repository」をクリック
3. GitHubリポジトリを選択
4. 以下の設定を行う：
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### バックエンド（Render）
1. https://render.com にアクセス
2. 「New Web Service」を作成
3. GitHubリポジトリを接続
4. 以下の設定を行う：
   - Name: `influencer-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node simple-backend.js`

### オプションB: Netlify（HTMLファイルのみ・即時公開）

1. https://app.netlify.com にアクセス
2. 「Add new site」→「Deploy manually」
3. 以下のファイルをドラッグ&ドロップ：
   - すべての `.html` ファイル
   - `simple-backend.js` は不要（静的サイトのため）

## ステップ3: 環境変数の設定

### Vercel環境変数：
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Render環境変数：
```
PORT=10000
DATABASE_URL=postgresql://...（Renderが自動生成）
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

## ステップ4: データベースの設定

### Render PostgreSQL（無料）
1. Renderダッシュボードで「New PostgreSQL」
2. 無料プランを選択
3. データベースURLをコピー
4. バックエンドの環境変数に設定

## 🎯 最速デプロイ手順（5分で完了）

### 今すぐ実行するコマンド：

```bash
# 1. 全ファイルをコミット
cd /Users/takanari/influencer-marketing-tool
git add .
git commit -m "Complete influencer marketing tool with all features"

# 2. GitHubにプッシュ（リポジトリ作成後）
git remote add origin https://github.com/YOUR_USERNAME/influencer-marketing-tool.git
git push -u origin main
```

### 次のステップ：
1. GitHubでリポジトリを作成
2. 上記コマンドの`YOUR_USERNAME`を実際のユーザー名に置き換えて実行
3. VercelまたはNetlifyでデプロイ

## 📝 重要な注意事項

- **データ永続性**: 無料プランではデータベースに制限があります
- **カスタムドメイン**: 後から追加可能です
- **SSL証明書**: 自動的に設定されます

## 質問

1. GitHubのユーザー名を教えていただけますか？
2. どちらのオプションを選択しますか？
   - A: 完全機能版（Vercel + Render）
   - B: 静的HTML版（Netlify）