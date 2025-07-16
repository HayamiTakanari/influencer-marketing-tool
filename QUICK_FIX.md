# 🔧 エラー解決ガイド

## "missing required error components" エラーの対処法

### ✅ 実装済みの修正
1. **エラーコンポーネント追加**
   - `_error.tsx` - カスタムエラーページ
   - `404.tsx` - 404ページ
   - `_app.tsx` - エラーバウンダリー追加

2. **依存関係修正**
   - Chart.js ライブラリ追加
   - Next.js セキュリティ更新

### 🚀 起動手順

#### 自動セットアップ（推奨）
```bash
cd /Users/takanari/influencer-marketing-tool
./start-local.sh
```

#### 手動セットアップ
1. **データベース作成**
```bash
createdb influencer_marketing
```

2. **バックエンド起動**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev  # ポート5002で起動
```

3. **フロントエンド起動（新しいターミナル）**
```bash
cd frontend
npm install
npm run dev  # ポート3000または3001で起動
```

### 🐛 よくある問題と解決法

#### ポート競合
- フロントエンド: 自動で3001に変更されます
- バックエンド: .envでPORTを変更可能

#### PostgreSQL接続エラー
```bash
# PostgreSQL起動確認
brew services list | grep postgresql

# 起動していない場合
brew services start postgresql
```

#### 依存関係エラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 📱 初回利用
1. ブラウザで http://localhost:3001 にアクセス
2. 右上「新規登録」をクリック
3. インフルエンサー または クライアント を選択
4. プロフィール情報を入力

### 🎯 主要機能のテスト順序
1. **アカウント作成・ログイン**
2. **プロフィール設定**
3. **ダッシュボード確認**
4. **検索機能（インフルエンサー向け）**
5. **プロジェクト作成（クライアント向け）**

### 💡 開発時のヒント
- 実際のStripe/SNS APIキーがなくても基本機能は動作します
- 支払い機能は後回しにして、まずコア機能を確認してください