# 技術スタック

本ドキュメントは、[08-workflow.md](./08-workflow.md) のワークフロー実装に必要な技術仕様を定義します。

---

## フロントエンド技術スタック

### フレームワーク・言語

| 技術 | 用途 | 理由 |
|------|------|------|
| **Next.js 14+** | React フレームワーク | SSR/SSG、API ルート、ファイルベースルーティング |
| **TypeScript** | 型安全な開発 | 大規模プロジェクト対応、エラー削減 |
| **React 18+** | UI フレームワーク | コンポーネントベース、Hook API |

### UI・スタイリング

| 技術 | 用途 |
|------|------|
| **Tailwind CSS** | ユーティリティベースのスタイリング |
| **shadcn/ui** | ヘッドレス UI コンポーネント |
| **Framer Motion** | アニメーション・マイクロインタラクション |

### 状態管理・データフェッチ

| 技術 | 用途 |
|------|------|
| **TanStack Query (React Query)** | API レスポンスキャッシング・同期 |
| **Zustand / Context API** | グローバルステート管理 |
| **SWR** | リアルタイムデータ同期 |

### フォーム・バリデーション

| 技術 | 用途 |
|------|------|
| **React Hook Form** | フォーム管理・バリデーション |
| **Zod / Yup** | スキーマバリデーション |

### 通信・API

| 技術 | 用途 |
|------|------|
| **axios / fetch** | HTTP リクエスト |
| **Socket.io-client** | リアルタイム通信（チャット） |
| **REST API** | バックエンド連携 |

### その他の重要なライブラリ

| ライブラリ | 用途 |
|-----------|------|
| **date-fns / Day.js** | 日付・時刻処理 |
| **xlsx / papaparse** | CSV・Excel ファイル処理（レポート出力用） |
| **recharts / Chart.js** | グラフ・チャート（分析ページ） |
| **react-pdf / jspdf** | PDF 生成・ダウンロード（契約書、請求書） |
| **react-dropzone** | ファイルアップロード（書類、成果物） |
| **react-signature-canvas** | デジタル署名（NDA 署名） |
| **next-auth** | OAuth 認証（Google、Facebook など） |

---

## バックエンド技術スタック

### ランタイム・フレームワーク

| 技術 | 用途 | 理由 |
|------|------|------|
| **Node.js 18+** | JavaScript ランタイム | 非同期 I/O、スケーラビリティ |
| **Express.js 4+** | Web API フレームワーク | ミドルウェア、シンプルな設計 |
| **TypeScript** | 型安全な開発 | 大規模プロジェクト対応 |

### データベース・ORM

| 技術 | 用途 | 理由 |
|------|------|------|
| **PostgreSQL 14+** | リレーショナルデータベース | 複雑なスキーマ、ACID トランザクション |
| **Prisma** | ORM・クエリビルダー | 型安全、マイグレーション自動化 |
| **Redis** | キャッシュ・セッション | 高速なデータアクセス |

### 認証・セキュリティ

| 技術 | 用途 |
|------|------|
| **jsonwebtoken (JWT)** | トークンベース認証 |
| **bcrypt** | パスワードハッシング |
| **passport.js** | OAuth 認証（Google、Facebook など） |
| **express-validator** | リクエスト入力検証 |
| **helmet** | HTTP ヘッダーセキュリティ |
| **cors** | クロスオリジン設定 |

### ファイル処理・ストレージ

| 技術 | 用途 |
|------|------|
| **multer** | ファイルアップロード処理 |
| **aws-sdk / @aws-sdk/client-s3** | AWS S3 連携（画像・ファイル保存） |
| **sharp** | 画像リサイズ・最適化 |

### リアルタイム通信

| 技術 | 用途 |
|------|------|
| **Socket.io** | WebSocket 通信（プロジェクト内チャット） |
| **redis adapter** | Socket.io のスケーリング |

### メール・通知

| 技術 | 用途 |
|------|------|
| **Nodemailer / SendGrid** | メール送信 |
| **bull / bullmq** | ジョブキュー（非同期メール配信） |
| **expo-notifications / FCM** | プッシュ通知 |

### 支払い・外部API連携

| 技術 | 用途 |
|------|------|
| **stripe** | 決済処理・月次請求 |
| **instagram-graph-api** | Instagram 認証・データ取得 |
| **tiktok-api** | TikTok 認証・データ取得 |
| **twitter-api-v2** | X（Twitter）認証・データ取得 |
| **youtube-api** | YouTube 認証・データ取得 |

### ログ・モニタリング

| 技術 | 用途 |
|------|------|
| **winston / pino** | アプリケーションログ |
| **sentry** | エラー追跡・アラート |
| **newrelic / datadog** | パフォーマンスモニタリング |

### テスト

| 技術 | 用途 |
|------|------|
| **jest** | ユニットテスト・統合テスト |
| **supertest** | HTTP エンドポイントテスト |
| **faker.js** | テストデータ生成 |

---

## データベーススキーマ（主要テーブル）

### ユーザー関連

```
users
├── id (UUID)
├── email (UNIQUE)
├── password_hash
├── role (ENUM: COMPANY, INFLUENCER, ADMIN)
├── status (ENUM: PENDING, VERIFIED, SUSPENDED, DELETED)
├── created_at
├── updated_at
├── deleted_at

company_profiles
├── user_id (FK)
├── company_name
├── legal_number
├── address
├── industry
├── logo_url
├── is_verified (boolean)
├── verified_at

influencer_profiles
├── user_id (FK)
├── display_name
├── bio
├── portfolio_url
├── availability_status (ENUM: ACTIVELY_SEEKING, OPEN, BUSY, ON_BREAK)
├── verified_sns (JSON: {youtube, instagram, tiktok, x, facebook})
├── total_followers
├── average_engagement_rate

team_members
├── id
├── company_id (FK)
├── email
├── role (ENUM: ADMIN, PROJECT_MANAGER, ACCOUNTING, VIEWER)
├── created_at
```

### プロジェクト・マッチング関連

```
projects
├── id (UUID)
├── company_id (FK)
├── title
├── description
├── budget
├── status (ENUM: DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED)
├── target_followers_min/max
├── required_sns (ARRAY)
├── application_deadline
├── created_at

applications
├── id (UUID)
├── project_id (FK)
├── influencer_id (FK)
├── status (ENUM: PENDING, APPROVED, REJECTED)
├── proposal_text
├── created_at

matches
├── id (UUID)
├── project_id (FK)
├── influencer_id (FK)
├── application_id (FK) [NULL if from scout]
├── status (ENUM: MATCHED, IN_PROGRESS, COMPLETED, CANCELLED)
├── matched_at
├── completed_at

scouts
├── id (UUID)
├── project_id (FK)
├── company_id (FK)
├── influencer_id (FK)
├── message
├── status (ENUM: SENT, ACCEPTED, DECLINED, EXPIRED)
├── created_at
├── responded_at
```

### チャット・コミュニケーション関連

```
chat_rooms
├── id (UUID)
├── match_id (FK)
├── created_at

chat_messages
├── id (UUID)
├── chat_room_id (FK)
├── user_id (FK)
├── content
├── attachments (JSON or ARRAY of URLs)
├── created_at
├── updated_at
├── deleted_at (soft delete)
```

### 契約・支払い関連

```
contracts
├── id (UUID)
├── match_id (FK)
├── contract_type (ENUM: NDA, SERVICE_AGREEMENT)
├── document_url
├── signed_by_company_at
├── signed_by_influencer_at
├── status (ENUM: DRAFT, PENDING_SIGNATURE, SIGNED, EXPIRED)
├── created_at

milestones
├── id (UUID)
├── match_id (FK)
├── title
├── description
├── due_date
├── status (ENUM: PENDING, IN_PROGRESS, COMPLETED)

invoices
├── id (UUID)
├── company_id (FK)
├── invoice_number (UNIQUE)
├── issued_date
├── due_date
├── total_amount
├── status (ENUM: DRAFT, ISSUED, OVERDUE, PAID)
├── invoice_url (PDF)

payments
├── id (UUID)
├── influencer_id (FK)
├── amount
├── status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED)
├── payment_method (ENUM: BANK_TRANSFER, STRIPE)
├── paid_at
├── created_at

transactions
├── id (UUID)
├── match_id (FK)
├── type (ENUM: INVOICE, PAYMENT, ADJUSTMENT)
├── amount
├── description
├── created_at
```

### 分析・評価関連

```
ratings
├── id (UUID)
├── match_id (FK)
├── rater_id (FK)
├── ratee_id (FK)
├── rating (INT: 1-5)
├── comment
├── created_at

analytics_events
├── id (UUID)
├── user_id (FK)
├── event_type (ENUM: PROJECT_CREATED, APPLICATION_SUBMITTED, MATCH_COMPLETED, etc.)
├── metadata (JSON)
├── created_at

project_analytics
├── id (UUID)
├── project_id (FK)
├── impressions
├── applications_count
├── matches_count
├── roi_value
├── updated_at
```

---

## API エンドポイント設計

### 認証エンドポイント

```
POST   /api/auth/register         # ユーザー登録
POST   /api/auth/login            # ログイン
POST   /api/auth/refresh-token    # トークンリフレッシュ
POST   /api/auth/logout           # ログアウト
POST   /api/auth/google           # Google OAuth
POST   /api/auth/verify-email     # メール認証
```

### プロジェクトエンドポイント

```
GET    /api/projects              # プロジェクト一覧
POST   /api/projects              # プロジェクト作成
GET    /api/projects/:id          # プロジェクト詳細
PUT    /api/projects/:id          # プロジェクト更新
DELETE /api/projects/:id          # プロジェクト削除
POST   /api/projects/:id/publish  # プロジェクト公開
```

### マッチングエンドポイント

```
GET    /api/influencers           # インフルエンサー検索
GET    /api/influencers/:id       # インフルエンサー詳細
POST   /api/applications          # 応募作成
GET    /api/applications          # 応募一覧
PUT    /api/applications/:id      # 応募更新（承認・却下）
POST   /api/scouts                # スカウト送信
PUT    /api/scouts/:id            # スカウト返答
GET    /api/matches               # マッチング一覧
```

### チャットエンドポイント

```
WS     /api/socket.io             # WebSocket 接続
GET    /api/chat/:match_id        # チャット履歴
POST   /api/chat/:match_id        # メッセージ送信
```

### 支払いエンドポイント

```
GET    /api/invoices              # 請求書一覧
POST   /api/invoices              # 請求書作成
GET    /api/invoices/:id          # 請求書詳細
POST   /api/invoices/:id/pdf      # PDF ダウンロード
GET    /api/payments              # 支払い一覧
POST   /api/payments/process      # 振込処理（管理者）
```

### 分析エンドポイント

```
GET    /api/analytics/projects    # プロジェクト分析
GET    /api/analytics/influencers # インフルエンサー分析
GET    /api/analytics/revenue     # 売上分析
GET    /api/reports/download      # レポート出力
```

---

## インフラストラクチャ

### 開発環境

| サービス | 用途 |
|---------|------|
| **Docker / Docker Compose** | ローカル開発環境 |
| **PostgreSQL** | ローカルDB |
| **Redis** | ローカルキャッシュ |

### ステージング環境

| サービス | 用途 |
|---------|------|
| **Vercel** | フロントエンドホスティング |
| **Render / Railway** | バックエンド API |
| **AWS RDS** | PostgreSQL マネージド |
| **AWS S3** | ファイルストレージ |
| **Redis Cloud** | キャッシュ・セッション |

### 本番環境

| サービス | 用途 |
|---------|------|
| **Vercel Pro** | フロントエンドホスティング・CDN |
| **AWS EC2 / ECS** | バックエンド API（オートスケーリング） |
| **AWS RDS** | PostgreSQL（マルチAZ） |
| **AWS S3** | ファイルストレージ（CloudFront キャッシュ） |
| **AWS ElastiCache** | Redis（高可用性） |
| **AWS SQS / Lambda** | 非同期ジョブ処理 |
| **CloudFlare** | DDoS 防止・キャッシング |

---

## 開発ツール

| ツール | 用途 |
|--------|------|
| **Git / GitHub** | バージョン管理・CI/CD |
| **GitHub Actions** | 自動テスト・デプロイ |
| **Postman / Insomnia** | API テスト・ドキュメント |
| **pgAdmin / DBeaver** | データベース管理 |
| **VS Code** | コードエディタ |
| **ESLint** | コード品質チェック |
| **Prettier** | コード自動フォーマット |

---

## セキュリティ技術

### 認証・認可

- **JWT (JSON Web Token)**: ステートレス認証
- **OAuth 2.0**: ソーシャル認証
- **RBAC (Role-Based Access Control)**: 権限管理

### データ保護

- **TLS/SSL**: 通信暗号化
- **データベース暗号化**: 保存時の暗号化
- **bcrypt**: パスワードハッシング

### 入力検証・XSS対策

- **DOMPurify**: リッチテキスト入力のサニタイズ
- **express-validator**: リクエストバリデーション
- **Content Security Policy**: CSP ヘッダー

### レート制限・DDoS対策

- **express-rate-limit**: API レート制限
- **CloudFlare**: DDoS 防止

---

## パフォーマンス最適化

### キャッシング戦略

- **Redis キャッシュ**: ホットデータ
- **CDN**: 静的資産配信
- **ブラウザキャッシュ**: HTTP キャッシュヘッダー

### 非同期処理

- **Bull / BullMQ**: ジョブキュー
- **AWS Lambda**: サーバーレス処理
- **Cron ジョブ**: 定期処理

### データベース最適化

- **インデックス**: 検索性能
- **接続プール**: PgBouncer
- **読み込みレプリカ**: 読み込み性能

---

**最終更新**: 2025-11-30
**関連ドキュメント**: [08-workflow.md](./08-workflow.md)、[06-performance.md](./06-performance.md)
