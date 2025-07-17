# 🛠️ Renderビルドエラーの修正

## 現在のエラー状況
- Status: Exited with status 1
- Commit: Fix build errors: Switch to simple-backend.js for Render deployment

## 📋 確認すべき項目

### 1️⃣ Renderの設定確認
以下の設定が正しいか確認してください：

```
Name: influencer-backend
Environment: Node
Region: Singapore
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### 2️⃣ 環境変数の確認
```
NODE_ENV=production
JWT_SECRET=super-secret-jwt-key-for-influencer-marketing-tool-2024
PORT=10000
DATABASE_URL=<PostgreSQLのInternal Database URL>
```

### 3️⃣ ログの確認
「Logs」タブで以下を確認：
- npm installは成功しているか
- どの時点でエラーが発生しているか
- 具体的なエラーメッセージ

## 🔧 修正手順

### オプション1: 設定の再確認
1. Root Directoryが「backend」になっているか確認
2. Start Commandが「npm start」になっているか確認
3. 環境変数が正しく設定されているか確認

### オプション2: 手動で設定変更
1. Renderダッシュボードで「Settings」タブ
2. 「Build & Deploy」セクション
3. 設定値を以下に変更：
   - Build Command: `npm install`
   - Start Command: `node simple-backend.js`

### オプション3: 最小構成での再試行
Build Commandを以下に変更：
```
npm install --production
```

## 🎯 次のステップ

1. **「Logs」タブで詳細なエラー内容を確認**
2. **設定値を再確認**  
3. **必要に応じて設定を修正**
4. **「Manual Deploy」で再デプロイ**

## 📞 サポート情報

エラーの詳細内容を教えてください：
- 「Logs」タブの具体的なエラーメッセージ
- どの段階で失敗しているか（npm install / npm start）
- 環境変数の設定状況