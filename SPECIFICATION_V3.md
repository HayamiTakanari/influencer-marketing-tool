# インフルエンサーマーケティングツール 仕様書 v3.0

## 📋 目次

1. [概要](#概要)
2. [v3.0 新機能](#v30-新機能)
3. [システム構成](#システム構成)
4. [データモデル](#データモデル)
5. [API仕様](#api仕様)
6. [画面構成](#画面構成)
7. [実装詳細](#実装詳細)
8. [今後の展開](#今後の展開)

## 概要

### 製品名
インフルエンサーマーケティングツール v3.0

### バージョン3.0の主要コンセプト
- **実績重視のマッチング**: 過去の実績データによる精度の高いマッチング
- **透明性の高い料金体系**: サービス別料金の明確化
- **効率的なコミュニケーション**: 一斉問い合わせによる工数削減
- **プロジェクト管理の強化**: スケジュール管理とアラート機能

## v3.0 新機能

### 1. 実績管理システム

#### 機能概要
インフルエンサーの過去の実績を詳細に記録し、目的別に分類できるシステム

#### 主な機能
- **実績登録**: プロジェクト名、ブランド名、目的、成果指標の記録
- **目的別分類**: 
  - 売上目的 (SALES)
  - 集客目的 (LEAD_GEN)
  - 認知拡大目的 (AWARENESS)
  - ブランドイメージ向上 (BRAND_IMAGE)
  - エンゲージメント向上 (ENGAGEMENT)
- **成果指標**: ビュー数、いいね数、シェア数、コンバージョン数等
- **実績統計**: 目的別・プラットフォーム別の実績サマリー

#### データ構造
```typescript
interface Achievement {
  id: string;
  projectName: string;
  brandName: string;
  purpose: AchievementPurpose;
  platform: Platform;
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    conversions?: number;
  };
  budget?: number;
  imageUrl?: string;
  link?: string;
}
```

### 2. 料金体系管理システム

#### 機能概要
インフルエンサーがサービス別に料金を設定し、必須登録とするシステム

#### 対象サービス
- **撮影 (PHOTOGRAPHY)**: 商品・サービスの撮影
- **動画編集 (VIDEO_EDITING)**: 動画コンテンツの編集
- **コンテンツ制作 (CONTENT_CREATION)**: 投稿用コンテンツの制作
- **投稿 (POSTING)**: SNSへの投稿作業
- **ストーリー制作 (STORY_CREATION)**: ストーリーコンテンツの制作
- **コンサルティング (CONSULTATION)**: マーケティング相談
- **ライブ配信 (LIVE_STREAMING)**: ライブ配信の実施
- **イベント出演 (EVENT_APPEARANCE)**: イベントへの出演

#### 料金設定機能
- **必須登録**: 最低4つのサービス料金設定を必須化
- **単位設定**: 投稿単位、時間単位、日単位の選択
- **価格更新**: リアルタイムでの価格変更
- **見積もり自動計算**: 選択サービスの自動見積もり

### 3. 一斉問い合わせシステム

#### 機能概要
クライアントが複数のインフルエンサーに同時に問い合わせを送信できるシステム

#### 主な機能
- **一斉送信**: 選択したインフルエンサーへの同時問い合わせ
- **個別回答**: インフルエンサーごとの個別回答管理
- **回答状況管理**: 承諾・辞退・未回答の状況確認
- **回答期限設定**: 自動的な期限切れ処理

#### ワークフロー
1. クライアントが問い合わせ内容を作成
2. 対象インフルエンサーを選択
3. 一斉送信実行
4. インフルエンサーが個別に回答
5. クライアントが回答を確認・選択

### 4. スケジュール管理システム

#### 機能概要
投稿日を起点とした逆算スケジュール管理と前日アラート機能

#### マイルストーン管理
- **構成案承認 (CONCEPT_APPROVAL)**: 企画内容の承認
- **動画完成 (VIDEO_COMPLETION)**: 動画制作の完了
- **最終承認 (FINAL_APPROVAL)**: 最終コンテンツの承認
- **投稿日 (PUBLISH_DATE)**: 実際の投稿日

#### アラート機能
- **前日通知**: 各マイルストーンの前日にアラート送信
- **期限切れ通知**: 期限を過ぎたマイルストーンの通知
- **自動スケジューリング**: 投稿日からの逆算スケジュール生成

## システム構成

### 技術スタック更新

#### 新規追加ライブラリ
- **node-cron**: スケジュール通知の定期実行
- **zod**: バリデーションスキーマの強化

#### データベース拡張
- **Achievement**: 実績管理テーブル
- **ServicePricing**: 料金体系テーブル
- **BulkInquiry**: 一斉問い合わせテーブル
- **InquiryResponse**: 問い合わせ回答テーブル
- **ProjectSchedule**: プロジェクトスケジュールテーブル
- **Milestone**: マイルストーンテーブル

## データモデル

### 新規テーブル

#### Achievement（実績）
```sql
CREATE TABLE Achievement (
  id TEXT PRIMARY KEY,
  influencerId TEXT NOT NULL,
  projectName TEXT NOT NULL,
  brandName TEXT NOT NULL,
  purpose AchievementPurpose NOT NULL,
  platform Platform NOT NULL,
  description TEXT,
  metrics JSONB,
  budget INTEGER,
  duration TEXT,
  imageUrl TEXT,
  link TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### ServicePricing（料金体系）
```sql
CREATE TABLE ServicePricing (
  id TEXT PRIMARY KEY,
  influencerId TEXT NOT NULL,
  serviceType ServiceType NOT NULL,
  price INTEGER NOT NULL,
  unit TEXT DEFAULT 'per_post',
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(influencerId, serviceType)
);
```

#### BulkInquiry（一斉問い合わせ）
```sql
CREATE TABLE BulkInquiry (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget INTEGER,
  deadline TIMESTAMP,
  requiredServices ServiceType[] NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### ProjectSchedule（プロジェクトスケジュール）
```sql
CREATE TABLE ProjectSchedule (
  id TEXT PRIMARY KEY,
  projectId TEXT UNIQUE NOT NULL,
  publishDate TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Milestone（マイルストーン）
```sql
CREATE TABLE Milestone (
  id TEXT PRIMARY KEY,
  scheduleId TEXT NOT NULL,
  type MilestoneType NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dueDate TIMESTAMP NOT NULL,
  isCompleted BOOLEAN DEFAULT FALSE,
  completedAt TIMESTAMP,
  notificationSent BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## API仕様

### 新規エンドポイント

#### 実績管理
```
POST   /api/achievements                    # 実績作成
GET    /api/achievements/my-achievements    # 自分の実績一覧
GET    /api/achievements/stats              # 実績統計
GET    /api/achievements/influencer/:id     # 特定インフルエンサーの実績
PUT    /api/achievements/:id                # 実績更新
DELETE /api/achievements/:id                # 実績削除
```

#### 料金体系
```
POST   /api/service-pricing                 # 料金設定作成
POST   /api/service-pricing/bulk            # 料金設定一括作成
GET    /api/service-pricing/my-pricing      # 自分の料金設定
GET    /api/service-pricing/validate        # 料金設定バリデーション
GET    /api/service-pricing/influencer/:id  # 特定インフルエンサーの料金
PUT    /api/service-pricing/:id             # 料金更新
DELETE /api/service-pricing/:id             # 料金削除
```

#### 一斉問い合わせ
```
POST   /api/bulk-inquiries                  # 一斉問い合わせ作成
GET    /api/bulk-inquiries/my-inquiries     # 自分の問い合わせ一覧
GET    /api/bulk-inquiries/my-responses     # 自分への問い合わせ一覧
GET    /api/bulk-inquiries/stats            # 問い合わせ統計
GET    /api/bulk-inquiries/:id              # 問い合わせ詳細
PUT    /api/bulk-inquiries/response/:id     # 問い合わせ回答更新
```

#### スケジュール管理
```
POST   /api/schedules                       # スケジュール作成
GET    /api/schedules/upcoming              # 今後のマイルストーン
GET    /api/schedules/project/:id           # プロジェクトスケジュール
PUT    /api/schedules/milestone/:id         # マイルストーン更新
POST   /api/schedules/notifications         # 通知送信（システム用）
```

## 画面構成

### 新規画面

#### インフルエンサー用
1. **実績管理画面** (`/achievements`)
   - 実績一覧表示
   - 実績登録・編集フォーム
   - 成果指標の入力
   - 実績統計ダッシュボード

2. **料金設定画面** (`/service-pricing`)
   - サービス別料金設定
   - 一括設定フォーム
   - 料金履歴管理
   - 見積もりプレビュー

3. **問い合わせ管理画面** (`/inquiries`)
   - 受信問い合わせ一覧
   - 回答フォーム
   - 回答状況確認
   - 期限管理

#### クライアント用
1. **一斉問い合わせ画面** (`/bulk-inquiry`)
   - 問い合わせ作成フォーム
   - インフルエンサー選択
   - 回答状況管理
   - 回答比較機能

2. **スケジュール管理画面** (`/schedule`)
   - プロジェクトスケジュール作成
   - マイルストーン設定
   - 進捗管理
   - アラート設定

#### 共通画面
1. **実績検索画面** (`/achievements/search`)
   - 目的別実績検索
   - 成果指標フィルター
   - 実績比較機能

## 実装詳細

### バリデーション

#### 実績登録バリデーション
```typescript
const achievementSchema = z.object({
  projectName: z.string().min(1, 'プロジェクト名は必須です'),
  brandName: z.string().min(1, 'ブランド名は必須です'),
  purpose: z.enum(['SALES', 'LEAD_GEN', 'AWARENESS', 'BRAND_IMAGE', 'ENGAGEMENT']),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER']),
  metrics: z.object({
    views: z.number().min(0).optional(),
    likes: z.number().min(0).optional(),
    shares: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
  }).optional(),
});
```

#### 料金設定バリデーション
```typescript
const servicePricingSchema = z.object({
  serviceType: z.enum([
    'PHOTOGRAPHY', 'VIDEO_EDITING', 'CONTENT_CREATION', 'POSTING',
    'STORY_CREATION', 'CONSULTATION', 'LIVE_STREAMING', 'EVENT_APPEARANCE'
  ]),
  price: z.number().min(1, '料金は1円以上で設定してください'),
  unit: z.string().default('per_post'),
  description: z.string().optional(),
});
```

### 通知システム

#### 定期実行スケジュール
```typescript
// 毎日午前9時：マイルストーン前日通知
cron.schedule('0 9 * * *', async () => {
  await NotificationService.sendMilestoneReminders();
});

// 毎日午後6時：期限切れマイルストーン通知
cron.schedule('0 18 * * *', async () => {
  await NotificationService.checkOverdueMilestones();
});

// 毎日午前0時：期限切れ問い合わせ処理
cron.schedule('0 0 * * *', async () => {
  await NotificationService.checkExpiredInquiries();
});
```

### セキュリティ

#### 権限管理
- **実績管理**: インフルエンサーのみ作成・編集可能
- **料金設定**: インフルエンサーのみ設定可能、必須登録チェック
- **一斉問い合わせ**: クライアントのみ作成可能
- **スケジュール管理**: プロジェクト関係者のみアクセス可能

#### データアクセス制御
- **実績データ**: 所有者のみ編集可能、他者は閲覧のみ
- **料金データ**: 所有者のみ編集可能、他者は閲覧のみ
- **問い合わせデータ**: 送信者と受信者のみアクセス可能

## 今後の展開

### フェーズ1（1-2ヶ月）
- **AI推奨システム**: 実績データに基づくマッチング精度向上
- **料金最適化**: 市場価格に基づく料金推奨機能
- **レポート機能**: 実績データの詳細分析レポート

### フェーズ2（3-4ヶ月）
- **コンテンツ管理**: 制作物の版管理システム
- **承認フロー**: 多段階承認システムの実装
- **外部ツール連携**: Slack、Teams等との連携

### フェーズ3（6ヶ月）
- **機械学習**: 成果予測モデルの実装
- **ブロックチェーン**: 実績データの改ざん防止
- **国際化**: 多言語・多通貨対応

### KPI・成功指標
- **マッチング精度**: 実績データ活用によるマッチング成功率向上
- **効率性**: 一斉問い合わせによる工数削減率
- **プロジェクト成功率**: スケジュール管理による期限内完了率
- **ユーザー満足度**: 新機能に対するユーザー評価

---

## 更新履歴

### v3.0.0 (2025-07-16)
- 実績管理システムの実装
- 料金体系管理システムの実装
- 一斉問い合わせシステムの実装
- スケジュール管理システムの実装
- 通知システムの強化

### v2.0.0 (2025-07-16)
- エラーメッセージの日本語詳細表示
- クライアントサイドバリデーション強化
- UI/UXの全面改善

### v1.0.0 (2025-07-15)
- 初期リリース
- 基本機能の実装

---

本仕様書は随時更新されます。最新版は [SPECIFICATION_V3.md](./SPECIFICATION_V3.md) を参照してください。