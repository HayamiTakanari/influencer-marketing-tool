# SQLインジェクション対策の手動テスト手順

## 1. 環境準備

### バックエンドサーバーの起動
```bash
cd backend
npm install  # 依存関係のインストール
npm run dev  # 開発サーバーの起動（ポート5002）
```

### データベースの確認
```bash
# Prismaでデータベースをセットアップ
npx prisma migrate dev
npx prisma studio  # データベースをGUIで確認（オプション）
```

## 2. curlを使用した手動テスト

### 2.1 正常なリクエスト（ベースライン）
```bash
# 正常な登録
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "influencer"
  }'

# 正常なログイン
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2.2 SQLインジェクション攻撃のテスト

#### テスト1: 基本的なSQLインジェクション
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com'\'' OR '\''1'\''='\''1",
    "password": "anything"
  }'
```
**期待結果**: 400エラー（バリデーションエラー）

#### テスト2: UNION SELECT攻撃
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com'\'' UNION SELECT * FROM users--",
    "password": "password"
  }'
```
**期待結果**: 400エラー（バリデーションエラー）

#### テスト3: DROP TABLE攻撃
```bash
curl -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com'\''; DROP TABLE users;--",
    "password": "password",
    "role": "influencer"
  }'
```
**期待結果**: 400エラー（バリデーションエラー）

#### テスト4: コメントベースの攻撃
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com'\''/*",
    "password": "*/OR/**/1=1--"
  }'
```
**期待結果**: 400エラー（バリデーションエラー）

## 3. ブラウザ開発者ツールを使用したテスト

1. Chromeの開発者ツールを開く（F12）
2. Networkタブを選択
3. フロントエンドのログインページにアクセス
4. 以下の値を入力してテスト：

### 悪意のある入力値の例
- Email: `admin' OR '1'='1`
- Password: `' OR '1'='1`

## 4. Postmanを使用したテスト

Postmanで以下のコレクションを作成：

### 登録エンドポイントテスト
```
POST http://localhost:5002/api/auth/register
Headers:
  Content-Type: application/json
Body:
{
  "email": "test'; INSERT INTO users VALUES ('hacker', 'hacked');--",
  "password": "password123",
  "role": "influencer"
}
```

## 5. 確認ポイント

### ✅ セキュリティ対策が有効な場合の確認項目
1. **バリデーションエラー**: 不正な形式のメールアドレスが拒否される
2. **エラーメッセージ**: SQLエラーの詳細が表示されない
3. **ログ記録**: セキュリティログに攻撃試行が記録される
4. **データベース**: 不正なデータが挿入されていない

### ❌ 脆弱性がある場合の兆候
1. SQLエラーメッセージが表示される
2. 不正なログインが成功する
3. データベースに予期しないデータが挿入される
4. アプリケーションがクラッシュする

## 6. 自動テストスクリプトの実行

```bash
# axiosをインストール（まだの場合）
npm install axios

# テストスクリプトを実行
node test-sql-injection.js
```

## 7. ログの確認

バックエンドサーバーのコンソール出力を確認し、以下を確認：
- SQLインジェクション試行の検出ログ
- バリデーションエラーのログ
- セキュリティイベントの記録

## 8. データベースの検証

```bash
# Prisma Studioでデータベースを確認
npx prisma studio
```

以下を確認：
- 不正なユーザーが作成されていない
- テーブルが削除されていない
- データの整合性が保たれている

## トラブルシューティング

### サーバーが起動しない場合
```bash
# 環境変数の確認
cat .env

# 必要な環境変数が設定されているか確認
# DATABASE_URL, JWT_SECRET など
```

### データベース接続エラーの場合
```bash
# Prismaクライアントの再生成
npx prisma generate

# マイグレーションの実行
npx prisma migrate dev
```