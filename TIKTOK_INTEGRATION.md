# TikTok API 統合ガイド

## 概要

このドキュメントでは、TikTok API 統合機能について説明します。RapidAPI の TikTok Video API を使用して、TikTok ユーザー情報とビデオ統計情報を取得できます。

## セットアップ

### 1. 環境変数の設定

`.env` ファイルに以下の環境変数を追加してください：

```env
# RapidAPI - TikTok Video API
RAPIDAPI_TIKTOK_HOST=tiktok-video-no-watermark2.p.rapidapi.com
RAPIDAPI_TIKTOK_KEY=your-rapidapi-key-here
```

### 2. RapidAPI キー取得方法

1. [RapidAPI](https://rapidapi.com) にアクセス
2. アカウントにログイン
3. "TikTok Video No Watermark2" API を検索
4. Subscribe ボタンをクリック
5. ダッシュボードから API キーをコピー

## バックエンド API エンドポイント

### 1. ビデオ情報取得

**エンドポイント**: `POST /api/tiktok/video-info`

**説明**: TikTok ビデオ URL からビデオ情報を取得

**リクエスト**:
```json
{
  "videoUrl": "https://www.tiktok.com/@username/video/7123456789"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "v10044g50000c4cid3rc77u6qmqeq1gg",
    "title": "#ビデオタイトル",
    "coverUrl": "https://...",
    "stats": {
      "viewCount": 56332,
      "likeCount": 5200,
      "commentCount": 130,
      "engagementRate": 9.36
    },
    "author": {
      "unique_id": "username",
      "nickname": "Display Name",
      "avatarUrl": "https://..."
    },
    "createdAt": "2021-08-15T06:30:29.000Z",
    "downloadableUrl": "https://..."
  }
}
```

### 2. ユーザー情報取得

**エンドポイント**: `POST /api/tiktok/user-info`

**説明**: TikTok ビデオからユーザー情報を抽出

**リクエスト**:
```json
{
  "videoUrl": "https://www.tiktok.com/@username/video/7123456789"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "username": "unique_username",
    "nickname": "Display Name",
    "avatarUrl": "https://..."
  }
}
```

### 3. アカウント認証と追加（要認証）

**エンドポイント**: `POST /api/tiktok/verify-account`

**説明**: TikTok アカウントを認証してインフルエンサープロフィールに追加

**リクエストヘッダー**:
```
Authorization: Bearer <jwt-token>
```

**リクエスト**:
```json
{
  "videoUrl": "https://www.tiktok.com/@username/video/7123456789",
  "displayName": "My Display Name"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "socialAccount": {
      "id": "account-id",
      "influencerId": "influencer-id",
      "platform": "TIKTOK",
      "username": "unique_username",
      "profileUrl": "https://www.tiktok.com/@unique_username",
      "isVerified": true,
      "isConnected": true,
      "lastSynced": "2024-11-29T10:00:00Z"
    },
    "userInfo": {
      "username": "unique_username",
      "nickname": "Display Name",
      "avatarUrl": "https://..."
    }
  },
  "message": "TikTok account verified and added successfully"
}
```

### 4. アカウント統計取得（要認証）

**エンドポイント**: `GET /api/tiktok/account/:socialAccountId/stats`

**説明**: TikTok アカウントの統計情報を取得

**リクエストヘッダー**:
```
Authorization: Bearer <jwt-token>
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "username": "unique_username",
    "followerCount": 0,
    "engagementRate": 0,
    "isVerified": true,
    "lastSynced": "2024-11-29T10:00:00Z"
  }
}
```

### 5. アカウント同期（要認証）

**エンドポイント**: `POST /api/tiktok/sync/:socialAccountId`

**説明**: TikTok アカウントデータを最新の情報に同期

**リクエストヘッダー**:
```
Authorization: Bearer <jwt-token>
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "account-id",
    "username": "unique_username",
    "lastSynced": "2024-11-29T10:00:00Z"
  },
  "message": "TikTok account synced successfully"
}
```

### 6. アカウント削除（要認証）

**エンドポイント**: `DELETE /api/tiktok/account/:socialAccountId`

**説明**: TikTok アカウントをプロフィールから削除

**リクエストヘッダー**:
```
Authorization: Bearer <jwt-token>
```

**レスポンス**:
```json
{
  "success": true,
  "message": "TikTok account deleted successfully"
}
```

## フロントエンドコンポーネント

### TikTokAccountVerification コンポーネント

TikTok アカウントを認証するためのコンポーネント。

**使用例**:
```tsx
import TikTokAccountVerification from '../components/TikTokAccountVerification';

function MyComponent() {
  const handleSuccess = (socialAccount) => {
    console.log('Account verified:', socialAccount);
    // リロード、通知表示など
  };

  const handleError = (error) => {
    console.error('Verification failed:', error);
  };

  return (
    <TikTokAccountVerification
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

**Props**:
- `onSuccess?: (socialAccount: any) => void` - 認証成功時のコールバック
- `onError?: (error: string) => void` - エラー時のコールバック
- `existingAccount?: TikTokAccount | null` - 既存のアカウント情報

### TikTokAccountManager コンポーネント

既存の TikTok アカウントを管理するためのコンポーネント。

**使用例**:
```tsx
import TikTokAccountManager from '../components/TikTokAccountManager';

function ProfilePage() {
  return (
    <TikTokAccountManager
      socialAccountId="account-123"
      username="my_tiktok_username"
      onRefresh={() => {
        // リロード、再フェッチなど
      }}
    />
  );
}
```

**Props**:
- `socialAccountId?: string` - SocialAccount の ID
- `username?: string` - TikTok ユーザー名
- `onRefresh?: () => void` - 更新完了時のコールバック

## SNS 同期との統合

TikTok アカウントは SNS 同期フレームワークに統合されています。

```typescript
import { SNSSyncService } from '../services/sns.service';

const syncService = new SNSSyncService();

// TikTok アカウントを同期
await syncService.syncSocialAccount(socialAccountId);

// すべてのインフルエンサーのアカウントを同期
await syncService.syncAllInfluencerAccounts(influencerId);
```

## 注意事項

### API 制限

RapidAPI の TikTok API には以下の制限があります：

- **フォロワー数**: 公開 API では完全な取得不可（デフォルト値 0）
- **プライベート情報**: アクセス不可
- **レート制限**: API キーのプランによって異なる

### 本格的な実装のために

完全な TikTok 統計情報を取得するには、以下の方法を推奨します：

1. **TikTok Official API**: より詳細な統計情報を取得可能
   - 申請ページ: https://developer.tiktok.com/

2. **複数ビデオの統計集約**: 複数のビデオから平均エンゲージメント率を計算

3. **データベースキャッシング**: 定期的な同期結果をキャッシュ

## エラーハンドリング

### よくあるエラー

**1. 無効な URL**
```json
{
  "error": "Invalid TikTok URL",
  "message": "有効なTikTokビデオURLではありません"
}
```

**解決方法**: `https://www.tiktok.com/@username/video/VIDEO_ID` 形式を使用

**2. API キーが設定されていない**
```json
{
  "error": "Failed to fetch TikTok video information",
  "message": "TikTok API key not configured"
}
```

**解決方法**: 環境変数 `RAPIDAPI_TIKTOK_KEY` を設定

**3. レート制限超過**
```json
{
  "error": "Failed to fetch TikTok video information",
  "message": "Rate limit exceeded"
}
```

**解決方法**: API キーのプランをアップグレード

## トラブルシューティング

### ビデオ情報が取得できない場合

1. **URL が正しいか確認**
   - フル URL を使用: `https://www.tiktok.com/@username/video/123456789`
   - URL 短縮形は非対応

2. **API キーを確認**
   ```bash
   echo $RAPIDAPI_TIKTOK_KEY
   ```

3. **RapidAPI での購読を確認**
   - https://rapidapi.com/dashboard にログイン
   - TikTok API が Active か確認

4. **ネットワークを確認**
   ```bash
   curl -X GET "https://tiktok-video-no-watermark2.p.rapidapi.com/?url=https://www.tiktok.com/@tiktok/video/7231338487075638570&hd=1" \
     -H "x-rapidapi-key: YOUR_KEY" \
     -H "x-rapidapi-host: tiktok-video-no-watermark2.p.rapidapi.com"
   ```

## セキュリティ

### ベストプラクティス

1. **API キーを保護**
   - `.env` ファイルに保存
   - GitHub にコミットしない
   - 本番環境では別キーを使用

2. **URL 検証**
   - TikTok URL のバリデーション実装済み
   - プロトコル検証を実施

3. **レート制限**
   - バックエンド側でレート制限実装推奨
   - キューシステムの検討

## 参考資料

- [RapidAPI - TikTok Video API](https://rapidapi.com/tiktok-tiktok-official/api/tiktok-video-no-watermark2)
- [TikTok Official API](https://developer.tiktok.com/)
- [Prisma Schema](../backend/prisma/schema.prisma)

## サポート

問題が発生した場合は、以下の情報を提供してください：

- エラーメッセージの全文
- リクエスト URL
- 環境（開発 / 本番）
- ブラウザコンソール エラー（フロントエンド）
