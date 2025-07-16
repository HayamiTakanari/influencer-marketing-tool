# SNS API セットアップガイド

このドキュメントでは、インフルエンサーマーケティングツールでSNS APIを利用するための設定方法を説明します。

## 概要

以下のSNS プラットフォームのAPIが実装されています：
- **Twitter API v2** - フォロワー数、エンゲージメント率の自動取得
- **YouTube Data API v3** - チャンネル登録者数、動画統計の取得
- **Instagram Basic Display API** - ユーザー個別のOAuth認証（準備済み）

## 1. Twitter API v2 設定

### 必要な手順
1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. 新しいアプリケーションを作成
3. API Key & Secret を取得
4. Access Token & Secret を生成

### 環境変数設定
`.env` ファイルに以下を追加：

```bash
# Twitter API
TWITTER_API_KEY="your_twitter_api_key"
TWITTER_API_SECRET="your_twitter_api_secret"
TWITTER_ACCESS_TOKEN="your_access_token"
TWITTER_ACCESS_SECRET="your_access_secret"
```

### 取得可能データ
- ユーザー情報（フォロワー数、フォロー数、投稿数）
- 認証バッジの状態
- 最近のツイート（エンゲージメント計算用）
- エンゲージメント率の自動計算

## 2. YouTube Data API v3 設定

### 必要な手順
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成またはプロジェクトを選択
3. YouTube Data API v3 を有効化
4. 認証情報 > APIキー を作成

### 環境変数設定
`.env` ファイルに以下を追加：

```bash
# YouTube API
YOUTUBE_API_KEY="your_youtube_api_key"
```

### 取得可能データ
- チャンネル情報（登録者数、動画数、総視聴回数）
- 最新動画リスト
- 各動画の統計情報（視聴回数、いいね数、コメント数）
- エンゲージメント率の自動計算

## 3. Instagram Basic Display API（実装準備完了）

### 現在の実装状況
- OAuth認証フローの準備完了
- ユーザー個別認証でのデータ取得機能実装済み
- 一括同期は技術的制約により対象外

### 将来の拡張予定
Instagram Business API を使用した企業アカウント向け機能の追加を検討中

## API 使用方法

### バックエンドでの同期実行

```typescript
// 個別アカウントの同期
POST /api/sns/sync/{socialAccountId}

// インフルエンサーの全アカウント同期
POST /api/sns/sync-all

// 同期状況の確認
GET /api/sns/status

// 管理者による全体同期（要ADMIN権限）
POST /api/sns/sync-all-influencers
```

### フロントエンドでの操作

1. **インフルエンサーのプロフィール管理画面**
   - 個別アカウントの同期ボタン
   - 全アカウント一括同期ボタン
   - 最終同期時刻の表示

2. **管理者画面**
   - 全インフルエンサーの一括同期
   - API設定状況の確認
   - 同期ログの監視

## エラーハンドリング

### よくあるエラーと対処法

1. **Twitter API エラー**
   - `Authentication error`: APIキーが正しく設定されているか確認
   - `Rate limit exceeded`: APIレート制限に達している（15分後に再試行）
   - `User not found`: ユーザー名が存在しないか、アカウントが非公開

2. **YouTube API エラー**
   - `API key invalid`: Google Cloud ConsoleでAPIキーが正しく設定されているか確認
   - `Quota exceeded`: 日次クォータ制限に達している（翌日まで待機）
   - `Channel not found`: チャンネルIDが正しいか確認

3. **一般的なエラー**
   - `Failed to sync social account`: ネットワーク接続またはAPI設定を確認
   - `Database error`: データベース接続を確認

## セキュリティ考慮事項

1. **APIキーの管理**
   - `.env` ファイルは必ず `.gitignore` に含める
   - 本番環境では環境変数で設定
   - 定期的なAPIキーのローテーション推奨

2. **レート制限対策**
   - Twitter API: 15分間に900リクエスト
   - YouTube API: 1日10,000ユニット
   - 同期頻度の調整により制限内での運用

3. **プライバシー**
   - 取得データは必要最小限に制限
   - ユーザーの同意に基づくデータ取得
   - GDPR/個人情報保護法への準拠

## 料金について

### Twitter API v2
- Basic tier: 無料（月100万ツイート）
- Pro tier: $100/月（より高い制限）

### YouTube Data API v3
- 無料クォータ: 1日10,000ユニット
- 追加クォータ: $0.10/1,000ユニット

### Instagram Basic Display API
- 無料（Facebookアプリのレビューが必要）

## 運用開始手順

1. **開発環境での設定**
   ```bash
   # 1. 必要なNPMパッケージがインストール済み確認
   # twitter-api-v2, googleapis は既にインストール済み
   
   # 2. 環境変数設定
   cp .env.example .env
   # Twitter, YouTubeのAPIキーを設定
   
   # 3. バックエンド再起動
   npm run dev
   ```

2. **本番環境への適用**
   - 環境変数の設定
   - データベースマイグレーション（必要に応じて）
   - APIキーの有効性テスト

3. **定期同期の設定（オプション）**
   - cron ジョブまたはスケジューラーで自動同期設定
   - 推奨頻度: 1日1回または週1回

## トラブルシューティング

### 同期が動作しない場合
1. 環境変数が正しく設定されているか確認
2. APIキーの有効性をテスト
3. ネットワーク接続確認
4. バックエンドログの確認

### パフォーマンス問題
1. 同期頻度の調整
2. バッチ処理の最適化
3. APIレート制限の監視

## サポート

設定やトラブルシューティングでご不明な点がありましたら、以下をご確認ください：

1. このドキュメントの該当セクション
2. バックエンドのエラーログ
3. 各プラットフォームの公式ドキュメント
   - [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
   - [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
   - [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)

---

**注意**: このツールは各SNSプラットフォームの利用規約に準拠して使用してください。商用利用時は各プラットフォームのポリシーを必ず確認してください。