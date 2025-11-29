# TikTok API 統合 テストガイド

## テスト環境セットアップ

### 1. 環境変数確認

`.env` に以下が設定されているか確認：

```bash
cd /Users/kanomatayuta/influencer-marketing-tool/backend
cat .env | grep RAPIDAPI_TIKTOK
```

出力例：
```
RAPIDAPI_TIKTOK_HOST=tiktok-video-no-watermark2.p.rapidapi.com
RAPIDAPI_TIKTOK_KEY=your-api-key
```

### 2. バックエンドサーバー起動

```bash
cd backend
npm run dev
```

サーバーが起動したら、ターミナルに以下が表示されることを確認：
```
Server is running on port 5002
Health check: http://localhost:5002/health
```

### 3. フロントエンド起動（別ターミナル）

```bash
cd frontend
npm run dev
```

フロントエンドが起動したら、ターミナルに以下が表示されることを確認：
```
> next dev
- ready started server on 0.0.0.0:3000
```

---

## API テスト（cURL）

### テスト 1: ビデオ情報取得

```bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.tiktok.com/@tiktok/video/7231338487075638570"
  }'
```

**期待される応答:**
```json
{
  "success": true,
  "data": {
    "id": "v10044g50000c4cid3rc77u6qmqeq1gg",
    "title": "...",
    "stats": {
      "viewCount": 56332,
      "likeCount": 5200,
      "commentCount": 130,
      "engagementRate": 9.36
    },
    "author": {
      "unique_id": "tiktok",
      "nickname": "TikTok",
      "avatarUrl": "https://..."
    }
  }
}
```

### テスト 2: ユーザー情報取得

```bash
curl -X POST http://localhost:5002/api/tiktok/user-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.tiktok.com/@tiktok/video/7231338487075638570"
  }'
```

**期待される応答:**
```json
{
  "success": true,
  "data": {
    "username": "tiktok",
    "nickname": "TikTok",
    "avatarUrl": "https://..."
  }
}
```

### テスト 3: 無効な URL エラーハンドリング

```bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://invalid.com/video/123"
  }'
```

**期待される応答:**
```json
{
  "error": "Invalid TikTok URL"
}
```

### テスト 4: 必須フィールド検証

```bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{}'
```

**期待される応答:**
```json
{
  "error": "videoUrl is required"
}
```

---

## フロントエンドテスト

### テスト 1: TikTokAccountVerification コンポーネント

ブラウザで `http://localhost:3000/profile` にアクセス：

1. **TikTok アカウント認証セクション**を見つける
2. 有効な TikTok ビデオ URL を入力
   ```
   https://www.tiktok.com/@tiktok/video/7231338487075638570
   ```
3. 「動画情報を取得」ボタンをクリック
4. ビデオプレビューが表示されることを確認
5. 「このアカウントを認証」ボタンをクリック
6. 成功メッセージが表示されることを確認

### テスト 2: エラーハンドリング

1. 無効な URL を入力
   ```
   https://youtube.com/watch?v=123
   ```
2. エラーメッセージが表示されることを確認

### テスト 3: TikTokAccountManager コンポーネント

TikTok アカウントが正常に追加された後：

1. アカウントマネージャーコンポーネントが表示されることを確認
2. 「更新」ボタンをクリックしてアカウント情報を同期
3. 「削除」ボタンでアカウントを削除

---

## 統合テスト

### テスト 1: エンドツーエンド（ビデオ取得 → 認証 → 管理）

```typescript
// テストシナリオ
1. ログイン → インフルエンサープロフィール
2. TikTok セクション
3. ビデオ URL 入力 → 取得
4. ビデオプレビュー確認
5. 認証ボタン → 成功
6. プロフィール更新確認
7. アカウント管理機能テスト
8. ログアウト → 再ログイン → アカウント確認
```

### テスト 2: データベース確認

```bash
# Supabase にログイン後、SQL エディタで実行

-- TikTok アカウント確認
SELECT * FROM "SocialAccount" WHERE platform = 'TIKTOK';

-- インフルエンサープロフィール確認
SELECT id, "displayName", "isRegistered" FROM "Influencer" WHERE id = 'influencer-id';
```

---

## パフォーマンステスト

### レスポンス時間測定

```bash
# ビデオ情報取得の応答時間
curl -w "\nTime taken: %{time_total}s\n" \
  -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.tiktok.com/@tiktok/video/7231338487075638570"
  }'
```

**期待値**: 1 秒以下

### 大量リクエストテスト

```bash
# 10 回の連続リクエスト
for i in {1..10}; do
  curl -X POST http://localhost:5002/api/tiktok/video-info \
    -H "Content-Type: application/json" \
    -d '{
      "videoUrl": "https://www.tiktok.com/@tiktok/video/7231338487075638570"
    }' &
done
wait
```

---

## デバッグモード

### バックエンド

ファイル: `backend/src/services/tiktok.service.ts`

```typescript
// デバッグログを有効化
private debugLog(message: string, data?: any) {
  console.log(`[TikTok Service] ${message}`, data || '');
}
```

### フロントエンド

```typescript
// コンソールログを有効化
localStorage.setItem('debug', 'tiktok-*');
```

ブラウザコンソールで詳細なログを確認できます。

---

## トラブルシューティング

### Issue: "API key not configured"

**原因**: 環境変数が設定されていない

**解決方法**:
```bash
# .env を確認
grep RAPIDAPI_TIKTOK_KEY .env

# なければ追加
echo "RAPIDAPI_TIKTOK_KEY=your-api-key" >> .env

# サーバー再起動
npm run dev
```

### Issue: "Invalid TikTok URL"

**原因**: URL 形式が不正

**正しい URL 形式**:
```
https://www.tiktok.com/@username/video/VIDEO_ID
```

**短縮 URL はサポートされていません**:
```
❌ https://vm.tiktok.com/xxxxxx  (短縮 URL)
✅ https://www.tiktok.com/@tiktok/video/7231338487075638570
```

### Issue: "Failed to fetch" エラー

**原因**: CORS またはネットワークエラー

**確認項目**:
1. バックエンドサーバーが起動しているか
2. ファイアウォール設定
3. API キーが有効か

```bash
# API キーの確認
curl -X GET "https://tiktok-video-no-watermark2.p.rapidapi.com/?url=https://www.tiktok.com/@tiktok/video/7231338487075638570&hd=1" \
  -H "x-rapidapi-key: $RAPIDAPI_TIKTOK_KEY" \
  -H "x-rapidapi-host: tiktok-video-no-watermark2.p.rapidapi.com"
```

### Issue: レート制限エラー

**原因**: RapidAPI のレート制限に達した

**解決方法**:
1. API キーのプランをアップグレード
2. キャッシング機構を実装
3. リクエスト間隔を調整

---

## テストチェックリスト

- [ ] ビデオ情報取得 API が正常に動作
- [ ] ユーザー情報取得 API が正常に動作
- [ ] URL バリデーションが正常に動作
- [ ] エラーハンドリングが正常に動作
- [ ] フロントエンドコンポーネントが表示
- [ ] TikTok アカウント認証が成功
- [ ] データベースにアカウント情報が保存
- [ ] アカウント更新が成功
- [ ] アカウント削除が成功
- [ ] エラーメッセージが正常に表示
- [ ] レスポンス時間が 1 秒以下

---

## 次のステップ

テストが完了したら：

1. **本番環境へのデプロイ**
   - 環境変数を本番環境に設定
   - バックエンド・フロントエンドを本番環境にデプロイ

2. **機能拡張**
   - 複数ビデオからのエンゲージメント率の平均算出
   - 定期的な自動同期スケジュール
   - TikTok Official API との統合（申請済み場合）

3. **モニタリング**
   - API 使用量の監視
   - エラーログの確認
   - パフォーマンスの監視

---

## サポートと質問

問題が発生した場合は、以下の情報を記録してください：

- エラーメッセージ全文
- リクエスト URL
- レスポンス JSON
- ブラウザコンソール出力
- ネットワークタブの詳細
- `.env` 設定（API キーは除外）
