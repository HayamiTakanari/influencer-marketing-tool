# インフルエンサー・マーケティング・ツール 仕様書

## 1. プロジェクト概要

### 1.1 プロジェクト名
インフルエンサー・マーケティング・ツール

### 1.2 目的
インフルエンサーとクライアント（企業）をマッチングし、効率的なマーケティング活動を支援するプラットフォーム

### 1.3 対象ユーザー
- **インフルエンサー**: SNSでの影響力を持つクリエイター
- **クライアント**: インフルエンサーマーケティングを行いたい企業
- **管理者**: プラットフォーム運営者

## 2. 技術スタック

### 2.1 バックエンド
- **ランタイム**: Node.js 18+
- **フレームワーク**: Express.js 4.19.2
- **言語**: TypeScript 5.4.3
- **データベース**: PostgreSQL
- **ORM**: Prisma 5.11.0
- **認証**: JWT (jsonwebtoken 9.0.2)
- **リアルタイム通信**: Socket.io 4.7.5
- **決済**: Stripe 14.21.0
- **画像管理**: Cloudinary 2.7.0
- **バリデーション**: Zod 3.22.4
- **セキュリティ**: Helmet, CORS, Rate Limiting

### 2.2 フロントエンド
- **フレームワーク**: Next.js 14.1.4
- **言語**: TypeScript 5.4.3
- **スタイリング**: Tailwind CSS 3.4.1
- **状態管理**: 
  - サーバーステート: React Query 5.28.6
  - クライアントステート: Zustand 4.5.2
- **フォーム**: React Hook Form 7.51.1
- **リアルタイム通信**: Socket.io Client 4.7.5
- **決済**: Stripe JS 3.0.6
- **UI コンポーネント**: React Select, Emoji Mart
- **バリデーション**: Zod 3.22.4

### 2.3 外部サービス
- **決済**: Stripe
- **画像管理**: Cloudinary
- **SNS API**: Twitter API v2, YouTube Data API v3, Instagram Basic Display API

## 3. データベース設計

### 3.1 主要テーブル

#### User（ユーザー）
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  role            UserRole  // CLIENT, INFLUENCER, ADMIN
  isVerified      Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Influencer（インフルエンサー）
```prisma
model Influencer {
  id              String    @id @default(cuid())
  userId          String    @unique
  displayName     String
  bio             String?
  gender          Gender    @default(NOT_SPECIFIED)
  birthDate       DateTime?
  phoneNumber     String?
  address         String?
  prefecture      String?
  city            String?
  categories      String[]  // 美容、ファッション、グルメなど
  priceMin        Int?      // 最低単価（円）
  priceMax        Int?      // 最高単価（円）
  isRegistered    Boolean   @default(false)
  lastUpdated     DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### SocialAccount（SNSアカウント）
```prisma
model SocialAccount {
  id              String    @id @default(cuid())
  influencerId    String
  platform        Platform  // INSTAGRAM, YOUTUBE, TIKTOK, TWITTER
  username        String
  profileUrl      String
  followerCount   Int       @default(0)
  engagementRate  Float?    // エンゲージメント率（%）
  isVerified      Boolean   @default(false)
  lastSynced      DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Project（プロジェクト）
```prisma
model Project {
  id              String    @id @default(cuid())
  clientId        String
  title           String
  description     String
  category        String
  budget          Int
  targetPlatforms Platform[]
  targetPrefecture String?
  targetCity      String?
  targetGender    Gender?
  targetAgeMin    Int?
  targetAgeMax    Int?
  targetFollowerMin Int?
  targetFollowerMax Int?
  status          ProjectStatus @default(PENDING)
  startDate       DateTime?
  endDate         DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### Transaction（決済）
```prisma
model Transaction {
  id              String    @id @default(cuid())
  projectId       String    @unique
  amount          Int       // 金額（円）
  fee             Int       // 手数料（円）
  stripePaymentId String    @unique
  status          String    // pending, completed, failed, refunded
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## 4. API設計

### 4.1 認証API
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/logout` - ログアウト
- `POST /api/auth/refresh` - トークンリフレッシュ

### 4.2 インフルエンサー検索API
- `GET /api/influencers/search` - 検索とフィルタリング
- `GET /api/influencers/:id` - 詳細情報取得
- `GET /api/influencers/:id/stats` - 統計情報取得
- `GET /api/influencers/categories` - カテゴリー一覧
- `GET /api/influencers/prefectures` - 都道府県一覧

### 4.3 プロフィール管理API
- `GET /api/profile/me` - 自分のプロフィール取得
- `PUT /api/profile/me` - プロフィール更新
- `POST /api/profile/me/complete-registration` - 登録完了
- `POST /api/profile/social-accounts` - SNSアカウント追加
- `PUT /api/profile/social-accounts/:id` - SNSアカウント更新
- `DELETE /api/profile/social-accounts/:id` - SNSアカウント削除
- `POST /api/profile/portfolio` - ポートフォリオ追加
- `PUT /api/profile/portfolio/:id` - ポートフォリオ更新
- `DELETE /api/profile/portfolio/:id` - ポートフォリオ削除
- `POST /api/profile/portfolio/:portfolioId/image` - 画像アップロード

### 4.4 チャットAPI
- `GET /api/chat/chats` - チャット一覧
- `GET /api/chat/messages/:projectId` - メッセージ取得
- `POST /api/chat/messages` - メッセージ送信
- `PUT /api/chat/messages/:projectId/read` - 既読マーク
- `GET /api/chat/unread-count` - 未読数取得

### 4.5 決済API
- `POST /api/payments/create-payment-intent` - 支払い意図作成
- `POST /api/payments/confirm-payment` - 支払い確認
- `GET /api/payments/history` - 支払い履歴
- `POST /api/payments/refund/:transactionId` - 返金処理
- `GET /api/payments/stats` - 決済統計
- `POST /api/payments/webhook` - Stripe Webhook

### 4.6 SNS連携API
- `POST /api/sns/sync/:socialAccountId` - アカウント同期
- `POST /api/sns/sync-all` - 全アカウント同期
- `GET /api/sns/sync-status` - 同期状況確認
- `POST /api/sns/sync-all-influencers` - 全インフルエンサー同期（管理者）

## 5. 機能仕様

### 5.1 インフルエンサー検索とフィルタリング

#### 5.1.1 検索条件
- **キーワード検索**: 名前、プロフィール文で検索
- **カテゴリー**: 美容、ファッション、グルメ、ライフスタイル等
- **プラットフォーム**: Instagram, YouTube, TikTok, Twitter
- **フォロワー数**: 最小値・最大値指定
- **価格帯**: 最低単価・最高単価指定
- **地域**: 都道府県・市区町村
- **性別**: 男性・女性・その他・指定なし
- **エンゲージメント率**: 最小値指定

#### 5.1.2 検索結果表示
- **無限スクロール**: ページネーション対応
- **カード表示**: プロフィール画像、名前、地域、カテゴリー、SNS統計
- **ソート**: 最新更新順、フォロワー数順、価格順

### 5.2 プロフィール管理

#### 5.2.1 基本情報
- 表示名、性別、生年月日、電話番号
- 住所、都道府県、市区町村
- 自己紹介文（500文字以内）
- カテゴリー選択（複数選択可）
- 価格設定（最低単価・最高単価）

#### 5.2.2 SNSアカウント管理
- プラットフォーム別アカウント追加
- ユーザー名、プロフィールURL登録
- フォロワー数、エンゲージメント率自動取得
- 認証済みアカウント表示

#### 5.2.3 ポートフォリオ管理
- 作品タイトル、説明文
- 画像アップロード（Cloudinary）
- 外部リンク設定
- プラットフォーム関連付け

### 5.3 チャット機能

#### 5.3.1 リアルタイムメッセージング
- **Socket.io**: リアルタイム双方向通信
- **テキストメッセージ**: 1000文字以内
- **絵文字サポート**: Emoji Mart使用
- **タイピング表示**: 入力中インジケーター
- **既読機能**: 既読・未読状態管理

#### 5.3.2 チャット管理
- **チャット一覧**: プロジェクト別チャット
- **未読数表示**: リアルタイム未読カウント
- **メッセージ履歴**: ページネーション対応
- **オンライン状態**: ユーザーの接続状況

### 5.4 Stripe決済統合

#### 5.4.1 支払い処理
- **Payment Intent**: 支払い意図作成
- **Stripe Elements**: セキュアなカード入力
- **手数料計算**: 10%プラットフォーム手数料
- **支払い確認**: サーバーサイド検証

#### 5.4.2 決済管理
- **支払い履歴**: 全取引履歴表示
- **返金処理**: クライアント側返金要求
- **統計情報**: 総支払額、総収益、完了取引数
- **Webhook処理**: Stripe イベント処理

### 5.5 SNS API連携

#### 5.5.1 Twitter API連携
- **ユーザー情報取得**: フォロワー数、認証状況
- **ツイート分析**: エンゲージメント率計算
- **自動同期**: 定期的なデータ更新

#### 5.5.2 YouTube API連携
- **チャンネル情報**: 登録者数、動画数、総再生数
- **動画分析**: エンゲージメント率計算
- **自動同期**: 定期的なデータ更新

#### 5.5.3 Instagram API連携
- **Basic Display API**: ユーザー情報、メディア情報
- **OAuth認証**: ユーザー個別認証
- **メディア分析**: エンゲージメント率計算

## 6. セキュリティ仕様

### 6.1 認証・認可
- **JWT認証**: アクセストークン、リフレッシュトークン
- **ロールベース認可**: CLIENT, INFLUENCER, ADMIN
- **パスワードハッシュ**: bcrypt使用
- **トークン検証**: 全APIエンドポイントで実装

### 6.2 セキュリティ対策
- **Rate Limiting**: IP別リクエスト制限
- **CORS設定**: オリジン制限
- **Helmet**: セキュリティヘッダー設定
- **入力値検証**: Zodスキーマ使用
- **SQLインジェクション対策**: Prisma ORM使用

### 6.3 データ保護
- **暗号化**: パスワード、機密データ
- **データ最小化**: 必要最小限のデータ収集
- **アクセス制御**: リソース別アクセス権限
- **監査ログ**: 重要操作のログ記録

## 7. パフォーマンス仕様

### 7.1 レスポンス時間
- **API応答時間**: 平均200ms以下
- **検索処理**: 500ms以下
- **リアルタイム通信**: 100ms以下のレイテンシ

### 7.2 スケーラビリティ
- **データベース最適化**: インデックス設定
- **クエリ最適化**: N+1問題対策
- **キャッシュ**: React Query使用
- **無限スクロール**: 大量データ対応

## 8. 開発・運用

### 8.1 開発環境
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **開発ツール**: TypeScript, ESLint, Prettier
- **テスト**: Jest, Testing Library（予定）

### 8.2 デプロイ
- **推奨プラットフォーム**: Railway, Vercel, Render
- **環境変数**: 各種APIキー、データベースURL
- **CI/CD**: GitHub Actions（予定）

### 8.3 モニタリング
- **エラー監視**: 実装予定
- **パフォーマンス監視**: 実装予定
- **使用量監視**: API使用量、データベース容量

## 9. 制限事項

### 9.1 現在の制限
- **Instagram API**: OAuth認証フローが必要
- **TikTok API**: 実装未完了
- **プロジェクト作成**: 実装未完了
- **マッチング機能**: 実装未完了

### 9.2 今後の拡張
- **AI推薦機能**: マッチング精度向上
- **分析ダッシュボード**: 詳細統計
- **モバイルアプリ**: React Native対応
- **多言語対応**: 国際化

## 10. ファイル構成

```
influencer-marketing-tool/
├── backend/
│   ├── src/
│   │   ├── controllers/     # APIコントローラー
│   │   ├── middleware/      # 認証・バリデーション
│   │   ├── routes/          # APIルート定義
│   │   ├── services/        # ビジネスロジック
│   │   ├── utils/           # ユーティリティ
│   │   └── index.ts         # エントリーポイント
│   ├── prisma/
│   │   └── schema.prisma    # データベーススキーマ
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── services/        # API呼び出し
│   │   ├── types/           # TypeScript型定義
│   │   └── pages/           # Next.jsページ
│   └── package.json
├── SETUP.md                 # セットアップガイド
└── SPECIFICATION.md         # 本仕様書
```

---

**作成日**: 2025年1月15日  
**バージョン**: 1.0.0  
**最終更新**: 2025年1月15日