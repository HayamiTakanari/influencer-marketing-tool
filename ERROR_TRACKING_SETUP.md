# エラートラッキング実装ガイド

## 完了した実装

### ✅ 1. ツール選定とアカウント発行
- **選定ツール**: Sentry
- **無料プラン**: 5,000エラー/月まで無料
- **完全対応**: React/Next.js、Node.js/Express

### ✅ 2. フロントエンド実装（React/Next.js対応）
- Sentry Next.js SDK統合
- クライアント/サーバー/エッジランタイム対応
- 自動ソースマップアップロード
- パフォーマンス監視

### ✅ 3. グローバルエラーハンドラー設定
- `window.onerror` 対応
- `window.addEventListener('unhandledrejection')` 対応
- リソース読み込みエラー対応
- React ErrorBoundary統合

### ✅ 4. バックエンド実装（Node.js/Express）
- Sentry Node.js SDK統合
- Express統合ミドルウェア
- PostgreSQL/Prisma統合
- HTTP tracing

### ✅ 5. API エラー・例外トラッキング
- カスタムエラークラス実装
- エラーカテゴリ分類
- データベースエラー追跡
- 外部API呼び出しエラー追跡

### ✅ 6. エラー情報カスタマイズ
- ユーザー情報自動付加
- デバイス情報抽出
- セッション情報追跡
- リクエスト情報詳細化

### ✅ 7. 環境識別・ユーザー情報付加
- 開発/本番環境自動識別
- ユーザーコンテキスト自動設定
- ビジネスコンテキスト追加
- パフォーマンスメトリクス

### ✅ 8. メール通知連携
- SMTP経由メール通知
- Slack Webhook統合
- カスタムWebhook対応
- レート制限・重複防止

## 設定手順

### 1. Sentryプロジェクト作成

1. **アカウント作成**: https://sentry.io/signup/
2. **フロントエンドプロジェクト**: JavaScript → Next.js
3. **バックエンドプロジェクト**: JavaScript → Node.js Express
4. **DSN取得**: プロジェクト設定からDSNをコピー

### 2. 環境変数設定

#### フロントエンド (.env.local)
```bash
NEXT_PUBLIC_SENTRY_DSN=your_frontend_dsn_here
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_frontend_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

#### バックエンド (.env)
```bash
# Sentry
SENTRY_DSN=your_backend_dsn_here
SENTRY_ENVIRONMENT=development

# Error Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ERROR_NOTIFICATION_RECIPIENTS=admin1@yourapp.com,admin2@yourapp.com

# Slack Integration
SLACK_ERROR_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_ERROR_CHANNEL=#errors

# App Info
APP_VERSION=1.0.0
NODE_ENV=development
```

### 3. Gmail設定（メール通知用）

1. **2段階認証を有効**
2. **アプリパスワード生成**: Google Account → Security → App passwords
3. **アプリパスワードを使用**: `SMTP_PASS` に設定

### 4. Slack設定（Slack通知用）

1. **Slack Webhook作成**: https://api.slack.com/messaging/webhooks
2. **チャンネル指定**: #errors チャンネル作成
3. **Webhook URLを設定**: `SLACK_ERROR_WEBHOOK_URL` に設定

## 実装詳細

### エラー分類システム

```typescript
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication', 
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

### カスタムエラークラス

```typescript
// バリデーションエラー
throw new ValidationError('Invalid email format', { field: 'email' });

// 認証エラー
throw new AuthenticationError('Invalid credentials');

// データベースエラー
throw new DatabaseError('Connection timeout', originalError);

// 外部APIエラー
throw new ExternalAPIError('Stripe', 500, 'Service unavailable');
```

### フロントエンドエラー追跡

```typescript
import { captureError, setUserContext, trackPageView } from '../utils/error-tracking';

// ユーザー情報設定
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role
});

// エラー手動送信
captureError(error, {
  component: 'UserProfile',
  action: 'update_profile',
  metadata: { formData }
});

// ページビュー追跡
trackPageView('/dashboard', user.id);
```

### バックエンドエラー追跡

```typescript
import { trackError, trackAPIPerformance } from '../utils/api-error-tracker';

// API エラー追跡
await trackError(error, {
  userId: req.user?.id,
  ipAddress: req.ip,
  endpoint: req.path,
  method: req.method,
  category: ErrorCategory.DATABASE,
  severity: ErrorSeverity.HIGH
});

// パフォーマンス追跡
trackAPIPerformance('GET', '/api/users', 200, 150, user.id);
```

## 通知設定

### 即座に通知されるエラー
- **CRITICAL**: システム停止に関わる重大エラー
- **HIGH**: 機能に影響するエラー

### バッチで通知されるエラー
- **MEDIUM**: 一般的なエラー

### 通知されないエラー
- **LOW**: 軽微なエラー

### レート制限
- **1時間あたり**: 最大10通知
- **1日あたり**: 最大50通知
- **クールダウン**: 同じエラーは5分間通知抑制

## 監視ダッシュボード

### Sentryダッシュボード
- エラー発生率
- 影響ユーザー数
- パフォーマンス指標
- リリース追跡

### カスタムメトリクス
- APIレスポンス時間
- データベース接続状況
- 外部API依存状況
- ユーザー行動分析

## トラブルシューティング

### よくある問題

1. **DSNが無効**
   - プロジェクト設定からDSNを再確認
   - 環境変数の設定確認

2. **メール通知が届かない**
   - SMTP設定確認
   - Gmailアプリパスワード確認
   - ファイアウォール設定確認

3. **Slack通知が届かない**
   - Webhook URL確認
   - チャンネル権限確認

4. **ソースマップがアップロードされない**
   - SENTRY_AUTH_TOKEN確認
   - ビルド時のSentry設定確認

### デバッグ方法

```typescript
// 開発環境でのテスト
if (process.env.NODE_ENV === 'development') {
  console.log('Sentry initialized:', Sentry.getCurrentHub().getClient());
}

// テスト用エラー送信
captureError(new Error('Test error'), {
  tags: { test: 'true' },
  level: 'info'
});
```

## セキュリティ考慮事項

### 機密情報のマスキング
- パスワード、トークン、API キーの自動マスキング
- リクエストヘッダーのサニタイズ
- URLパラメータの機密情報除去

### アクセス制御
- Sentryプロジェクトへのアクセス制限
- 通知先の限定
- ログの保存期間制限

---

これで包括的なエラートラッキングシステムが完成しました。開発からプロダクション運用まで対応できる強力な監視体制を構築できます。