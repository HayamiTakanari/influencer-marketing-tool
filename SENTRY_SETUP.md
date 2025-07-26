# Sentry エラートラッキング設定ガイド

## 1. Sentryアカウント設定

### アカウント作成
1. https://sentry.io/signup/ にアクセス
2. GitHubアカウントまたはメールアドレスで登録
3. 組織名: `influencer-marketing-tool`
4. プロジェクト名: `influencer-marketing-frontend` / `influencer-marketing-backend`

### プロジェクト作成
1. **フロントエンド**: JavaScript → Next.js
2. **バックエンド**: JavaScript → Node.js Express

### 無料プラン制限
- **エラー数**: 5,000エラー/月
- **保存期間**: 30日
- **チームメンバー**: 無制限
- **アラート**: ✅
- **リリース追跡**: ✅

## 2. 環境変数設定

.env.local (フロントエンド):
```
NEXT_PUBLIC_SENTRY_DSN=YOUR_FRONTEND_DSN_HERE
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
```

.env (バックエンド):
```
SENTRY_DSN=YOUR_BACKEND_DSN_HERE
SENTRY_ENVIRONMENT=development
```

## 3. 本番環境設定

### Vercel設定
- Environment Variables に SENTRY_DSN を追加
- SENTRY_ENVIRONMENT=production

### Railway/Heroku設定
- Config Vars に SENTRY_DSN を追加
- SENTRY_ENVIRONMENT=production

## 4. リリース追跡

### GitHub Actions設定例
```yaml
- name: Create Sentry release
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: influencer-marketing-tool
    SENTRY_PROJECT: influencer-marketing-frontend
  with:
    environment: production
```