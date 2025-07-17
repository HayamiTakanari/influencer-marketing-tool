# インフルエンサーマーケティングツール 仕様書 v2.0

## 📋 目次

1. [概要](#概要)
2. [システム構成](#システム構成)
3. [機能一覧](#機能一覧)
4. [データモデル](#データモデル)
5. [画面構成](#画面構成)
6. [API仕様](#api仕様)
7. [セキュリティ](#セキュリティ)
8. [バージョン2の新機能](#バージョン2の新機能)

## 概要

### 製品名
インフルエンサーマーケティングツール v2.0

### 目的
企業とインフルエンサーを効率的にマッチングし、マーケティング活動を支援するプラットフォーム

### 対象ユーザー
- **企業・ブランド（クライアント）**: マーケティング担当者、広報担当者
- **インフルエンサー**: SNSで影響力を持つクリエイター、ブロガー
- **管理者**: システム運営者

### 主要機能
1. インフルエンサー検索・マッチング
2. プロジェクト管理
3. チャット・コミュニケーション
4. 決済処理
5. レビュー・評価システム
6. アナリティクス・レポート

## システム構成

### 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 14.2.30
- **言語**: TypeScript
- **UIライブラリ**: React 18
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API
- **アニメーション**: Framer Motion
- **グラフ**: Chart.js
- **HTTPクライアント**: Axios
- **リアルタイム通信**: Socket.io-client

#### バックエンド
- **フレームワーク**: Express.js 4.19.2
- **言語**: TypeScript
- **ORM**: Prisma 5.11.0
- **データベース**: PostgreSQL
- **認証**: JWT (jsonwebtoken)
- **リアルタイム通信**: Socket.io
- **決済**: Stripe
- **ファイルアップロード**: Cloudinary + Multer

#### インフラ・ツール
- **パッケージマネージャー**: npm
- **プロセス管理**: tsx (開発環境)
- **Linter**: ESLint
- **ビルドツール**: Next.js built-in

### ディレクトリ構造

```
influencer-marketing-tool/
├── frontend/                    # フロントエンドアプリケーション
│   ├── src/
│   │   ├── pages/              # Next.jsページ
│   │   ├── components/         # 再利用可能なコンポーネント
│   │   ├── services/           # API通信サービス
│   │   ├── contexts/           # React Context
│   │   ├── hooks/              # カスタムフック
│   │   ├── types/              # TypeScript型定義
│   │   └── styles/             # グローバルスタイル
│   └── public/                 # 静的ファイル
├── backend/                     # バックエンドAPI
│   ├── src/
│   │   ├── controllers/        # APIコントローラー
│   │   ├── routes/             # ルート定義
│   │   ├── middleware/         # ミドルウェア
│   │   ├── services/           # ビジネスロジック
│   │   ├── schemas/            # バリデーションスキーマ
│   │   └── utils/              # ユーティリティ関数
│   └── prisma/                 # データベーススキーマ
└── docs/                       # ドキュメント
```

## 機能一覧

### 1. 認証・ユーザー管理

#### 1.1 ユーザー登録
- **メールアドレス/パスワード認証**
- **役割別登録フロー**
  - インフルエンサー: 表示名、カテゴリー選択
  - クライアント: 会社名、担当者名
- **バリデーション**
  - パスワード: 8文字以上必須
  - メールアドレス: 形式チェック
  - 必須項目: 空欄チェック
  - **v2新機能**: エラーメッセージの日本語詳細表示

#### 1.2 ログイン
- **JWT認証** (7日間有効)
- **テストアカウント** ワンクリック入力
- **自動リダイレクト** (ダッシュボードへ)
- **v2新機能**: クライアントサイドバリデーション

#### 1.3 プロフィール管理
- **基本情報編集**
  - インフルエンサー: 自己紹介、性別、生年月日、連絡先、活動地域、価格帯
  - クライアント: 会社情報、業界、予算、担当者情報
- **SNSアカウント連携**
  - Instagram、YouTube、TikTok、X(Twitter)
  - フォロワー数、エンゲージメント率の自動取得
- **ポートフォリオ**
  - 画像アップロード（最大5枚）
  - 実績説明文

### 2. インフルエンサー検索・発見

#### 2.1 検索機能
- **多条件検索**
  - カテゴリー（美容、ファッション、ライフスタイル等）
  - 都道府県
  - 価格帯
  - フォロワー数範囲
  - エンゲージメント率
- **ソート機能**
  - フォロワー数順
  - エンゲージメント率順
  - 新着順
  - 評価順

#### 2.2 インフルエンサー詳細
- **プロフィール表示**
- **SNS統計情報**
- **ポートフォリオギャラリー**
- **レビュー・評価**
- **コンタクトボタン**

### 3. プロジェクト管理

#### 3.1 プロジェクト作成 (クライアント)
- **基本情報**
  - タイトル、説明
  - カテゴリー、予算
  - 期間（開始日・終了日）
  - 必要なSNSプラットフォーム
- **要件定義**
  - 最小フォロワー数
  - 配信内容の詳細
  - 成果物の定義

#### 3.2 応募管理
- **インフルエンサー側**
  - 利用可能プロジェクト一覧
  - 応募フォーム（提案価格、メッセージ）
  - 応募状況確認
- **クライアント側**
  - 応募者一覧
  - 承認/拒否機能
  - 応募者プロフィール確認

#### 3.3 プロジェクトステータス
- `DRAFT`: 下書き
- `OPEN`: 募集中
- `IN_PROGRESS`: 進行中
- `COMPLETED`: 完了
- `CANCELLED`: キャンセル

### 4. コミュニケーション

#### 4.1 チャット機能
- **リアルタイムメッセージング** (Socket.io)
- **プロジェクト単位のチャットルーム**
- **既読/未読管理**
- **通知機能**
- **メッセージ履歴**

#### 4.2 通知システム
- **通知タイプ**
  - 新規メッセージ
  - プロジェクト応募
  - 応募承認/拒否
  - 支払い完了
  - レビュー投稿
- **未読数表示**
- **一括既読機能**

### 5. 決済機能

#### 5.1 支払い処理
- **Stripe統合**
- **支払いフロー**
  1. クライアントが支払い開始
  2. 決済情報入力
  3. 支払い確認
  4. インフルエンサーへの送金（手動）
- **手数料**: 10%のプラットフォーム手数料

#### 5.2 支払い履歴
- **取引一覧**
- **領収書ダウンロード**
- **返金処理**

### 6. レビュー・評価

#### 6.1 相互評価システム
- **5段階評価**
- **コメント機能**
- **公開/非公開設定**
- **プロジェクト完了後のみ投稿可能**

#### 6.2 評価統計
- **平均評価スコア**
- **評価数**
- **カテゴリー別評価**

### 7. アナリティクス

#### 7.1 ダッシュボード
- **概要統計**
  - アクティブプロジェクト数
  - 総収益/支出
  - 平均評価
  - 完了率
- **期間別分析** (週/月/年)

#### 7.2 パフォーマンス指標
- **プロジェクト成功率**
- **平均応答時間**
- **リピート率**
- **収益推移グラフ**

### 8. チーム管理 (クライアント)

#### 8.1 チーム機能
- **チーム作成**
- **メンバー招待** (メールアドレス)
- **権限管理**
  - オーナー: 全権限
  - メンバー: 閲覧・プロジェクト作成
- **共同プロジェクト管理**

## データモデル

### 主要エンティティ

#### User
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  role              UserRole
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  influencer        Influencer?
  client            Client?
  teamMemberships   TeamMember[]
  notifications     Notification[]
}

enum UserRole {
  INFLUENCER
  CLIENT
  ADMIN
}
```

#### Influencer
```prisma
model Influencer {
  id              String    @id @default(cuid())
  userId          String    @unique
  displayName     String
  bio             String?
  gender          Gender    @default(NOT_SPECIFIED)
  birthDate       DateTime?
  phoneNumber     String?
  categories      String[]
  priceMin        Int?
  priceMax        Int?
  prefecture      String?
  city            String?
  isRegistered    Boolean   @default(false)
  socialAccounts  SocialAccount[]
  portfolios      Portfolio[]
  applications    Application[]
  projects        Project[] @relation("InfluencerProjects")
  reviewsReceived Review[]  @relation("ReviewsReceived")
  reviewsGiven    Review[]  @relation("ReviewsGiven")
}
```

#### Project
```prisma
model Project {
  id              String    @id @default(cuid())
  clientId        String
  title           String
  description     String
  category        String
  budget          Int
  startDate       DateTime
  endDate         DateTime
  requiredPlatforms String[]
  minFollowers    Int?
  status          ProjectStatus @default(DRAFT)
  applications    Application[]
  influencerId    String?
  messages        Message[]
  payments        Payment[]
  reviews         Review[]
}
```

## 画面構成

### 共通画面
1. **ランディングページ** (`/`)
   - サービス紹介
   - 特徴説明
   - CTA（登録/ログイン）

2. **ログイン** (`/login`)
   - メール/パスワード入力
   - テストアカウントボタン
   - エラーメッセージ表示

3. **新規登録** (`/register`)
   - 役割選択（インフルエンサー/クライアント）
   - 必要情報入力
   - バリデーションエラー表示

4. **ダッシュボード** (`/dashboard`)
   - 役割別のメトリクス表示
   - 最近のアクティビティ
   - クイックアクション

### インフルエンサー専用画面
1. **案件一覧** (`/opportunities`)
   - 募集中プロジェクト表示
   - フィルター/ソート機能
   - 応募ボタン

2. **応募管理** (`/my-applications`)
   - 応募済み案件一覧
   - ステータス確認
   - メッセージ送信

3. **収益管理** (`/revenue`)
   - 収益統計
   - 支払い履歴
   - 収益推移グラフ

### クライアント専用画面
1. **インフルエンサー検索** (`/search`)
   - 検索フィルター
   - 結果一覧
   - 詳細表示

2. **プロジェクト管理** (`/projects`)
   - プロジェクト一覧
   - 新規作成
   - 編集/削除

3. **応募管理** (`/applications`)
   - 応募者一覧
   - プロフィール確認
   - 承認/拒否

4. **チーム管理** (`/team-management`)
   - メンバー一覧
   - 招待機能
   - 権限管理

### 共通機能画面
1. **チャット** (`/chat`)
   - 会話一覧
   - メッセージ送受信
   - 未読管理

2. **支払い** (`/payments/[projectId]`)
   - 決済フォーム
   - 確認画面
   - 完了通知

3. **レビュー** (`/reviews`)
   - 投稿フォーム
   - 履歴表示
   - 統計情報

4. **通知** (`/notifications`)
   - 通知一覧
   - 既読管理
   - フィルター

5. **プロフィール** (`/profile`)
   - 基本情報編集
   - SNSアカウント管理
   - ポートフォリオ管理

6. **アナリティクス** (`/analytics`)
   - パフォーマンス指標
   - 期間別分析
   - エクスポート機能

## API仕様

### 認証エンドポイント
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報

### インフルエンサー関連
- `GET /api/influencers/search` - インフルエンサー検索
- `GET /api/influencers/:id` - 詳細情報取得
- `GET /api/influencers/:id/stats` - 統計情報取得

### プロジェクト関連
- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/available` - 募集中プロジェクト一覧
- `POST /api/projects/apply` - プロジェクト応募
- `PUT /api/projects/:id/status` - ステータス更新

### 決済関連
- `POST /api/payments/create-payment-intent` - 支払い開始
- `POST /api/payments/confirm-payment` - 支払い確認
- `POST /api/payments/webhook` - Stripeウェブフック

### その他
- `GET /api/chat/messages/:projectId` - メッセージ取得
- `POST /api/reviews` - レビュー投稿
- `GET /api/analytics/overview` - 分析データ取得
- `POST /api/teams` - チーム作成

## セキュリティ

### 認証・認可
- **JWT認証**: 全APIエンドポイントで必須
- **役割ベースアクセス制御**: インフルエンサー/クライアント/管理者
- **セッション管理**: 7日間の有効期限

### データ保護
- **パスワードハッシュ化**: bcrypt (10 rounds)
- **HTTPS通信**: 本番環境で必須
- **CORS設定**: フロントエンドURLのみ許可
- **レート制限**: 15分間に100リクエストまで

### 入力検証
- **Zodスキーマ**: サーバーサイドバリデーション
- **SQLインジェクション対策**: Prisma ORM使用
- **XSS対策**: React自動エスケープ
- **CSRFトークン**: 今後実装予定

## バージョン2の新機能

### 1. エラーハンドリングの改善
- **詳細なエラーメッセージ**
  - バリデーションエラーの日本語表示
  - フィールド別のエラー表示
  - ユーザーフレンドリーなメッセージ

### 2. UIの改善
- **Framer Motionアニメーション**
  - ページ遷移アニメーション
  - ホバーエフェクト
  - ローディング状態の視覚化

### 3. パフォーマンス最適化
- **Next.js最適化設定**
  - 画像最適化
  - コード分割
  - 静的生成

### 4. 開発者体験の向上
- **TypeScript厳密モード**: 一時的に無効化
- **ESLintビルドエラー**: 無視オプション追加
- **デプロイ設定**: Vercel/Netlify対応

### 5. テスト環境の充実
- **テストアカウント**: ワンクリックログイン
- **モックデータ**: 開発環境用サンプルデータ
- **デバッグツール**: エラーログの詳細表示

## 今後の拡張予定

### フェーズ1 (3ヶ月)
- OAuth認証 (Google, LINE)
- AI推奨マッチング
- 自動レポート生成
- 多言語対応

### フェーズ2 (6ヶ月)
- モバイルアプリ (React Native)
- ビデオチャット機能
- 契約書自動生成
- APIの外部公開

### フェーズ3 (12ヶ月)
- ブロックチェーン決済
- NFTポートフォリオ
- グローバル展開
- エンタープライズ機能

---

## 更新履歴

### v2.0.0 (2025-07-16)
- エラーメッセージの日本語詳細表示
- クライアントサイドバリデーション強化
- UI/UXの全面改善
- デプロイ設定の最適化

### v1.0.0 (2025-07-15)
- 初期リリース
- 基本機能の実装

---

本仕様書は随時更新されます。最新版は [SPECIFICATION_V2.md](./SPECIFICATION_V2.md) を参照してください。