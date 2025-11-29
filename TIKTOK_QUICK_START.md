# TikTok API 統合 - クイックスタート

このガイドに従って、TikTok API 統合をテストします。

---

## 📋 前提条件

- Node.js 18+ がインストール済み
- npm または yarn
- `.env` ファイルが設定済み

---

## 🚀 ステップ 1: 環境変数設定

**ファイル**: `backend/.env`

```env
# RapidAPI - TikTok Video API
RAPIDAPI_TIKTOK_HOST=tiktok-video-no-watermark2.p.rapidapi.com
RAPIDAPI_TIKTOK_KEY=fffeeba8fbmsh3f25e93bda6a2b3p164cb2jsn76d173bc25df
```

確認:
```bash
cd backend
grep RAPIDAPI_TIKTOK .env
```

---

## 🚀 ステップ 2: バックエンドサーバー起動

```bash
cd backend
npm install  # 初回のみ
npm run dev
```

**出力:**
```
Server is running on port 5002
Health check: http://localhost:5002/health
```

✅ 確認: ターミナルにメッセージが表示されることを確認

---

## 🚀 ステップ 3: フロントエンドサーバー起動（別ターミナル）

```bash
cd frontend
npm install  # 初回のみ
npm run dev
```

**出力:**
```
> next dev
- ready started server on 0.0.0.0:3000
```

✅ 確認: ターミナルにメッセージが表示されることを確認

---

## 🧪 ステップ 4: API テスト（cURL）

**別ターミナルで実行:**

### テスト 4-1: ビデオ情報取得

```bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.tiktok.com/@tiktok/video/7231338487075638570"
  }' | jq
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

✅ 確認: success が true で、データが返されることを確認

### テスト 4-2: URL バリデーション

```bash
curl -X POST http://localhost:5002/api/tiktok/video-info \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://youtube.com/watch?v=123"
  }' | jq
```

**期待される応答:**
```json
{
  "error": "Invalid TikTok URL"
}
```

✅ 確認: エラーが返されることを確認

---

## 👤 ステップ 5: フロントエンドテスト

### 5-1. ブラウザでログイン

1. `http://localhost:3000` にアクセス
2. ログインページが表示される場合：
   - テスト用インフルエンサーアカウントでログイン
   - または、アカウント作成 → インフルエンサー選択 → プロフィール完成

### 5-2. プロフィールページにアクセス

**ログイン後:**

1. `http://localhost:3000/profile` にアクセス
2. **または** ダッシュボードから「プロフィール」をクリック
3. 「SNSアカウント」タブをクリック

### 5-3. TikTok セクション確認

**画面上に表示されるべきもの:**
- TikTok アカウントセクション（タイトル）
- TikTok アカウント認証フォーム（アカウント未追加の場合）

### 5-4. TikTok ビデオを認証

1. **TikTok 動画 URL** フィールドに以下を入力:
   ```
   https://www.tiktok.com/@tiktok/video/7231338487075638570
   ```

2. **「動画情報を取得」** ボタンをクリック

3. **期待される動作:**
   - ローディングアニメーション表示
   - ビデオプレビューが表示
   - ビデオタイトル、再生数、いいね数、コメント数が表示
   - TikTok ユーザー情報が表示

4. **「このアカウントを認証」** ボタンをクリック

5. **期待される結果:**
   - 成功メッセージ表示: "TikTok アカウントが正常に認証されました"
   - ページ自動リロード
   - TikTok アカウントマネージャーが表示

### 5-5. TikTok アカウントマネージャー操作

1. **アコーディオンを展開** - TikTok アカウント情報が表示
2. **「更新」ボタン** - アカウント情報を同期
3. **「削除」ボタン** - アカウントを削除

✅ 確認: 各操作が正常に動作することを確認

---

## 🐛 トラブルシューティング

### Issue: "API key not configured" エラー

**原因**: 環境変数が設定されていない

**解決方法**:
```bash
# backend/.env を確認
cat backend/.env | grep RAPIDAPI_TIKTOK

# なければ追加
echo "RAPIDAPI_TIKTOK_HOST=tiktok-video-no-watermark2.p.rapidapi.com" >> backend/.env
echo "RAPIDAPI_TIKTOK_KEY=your-api-key" >> backend/.env

# サーバー再起動
npm run dev
```

### Issue: "Invalid TikTok URL" エラー

**原因**: URL 形式が正しくない

**正しい形式**:
```
https://www.tiktok.com/@tiktok/video/7231338487075638570
                        ↓       ↓     ↓
                    username  video ID
```

**間違った形式**:
```
❌ https://vm.tiktok.com/xxxxxx
❌ https://tiktok.com/@tiktok
❌ https://www.tiktok.com/video/123
```

### Issue: CORS エラー

**原因**: バックエンドサーバーが起動していない

**解決方法**:
```bash
# バックエンドが起動しているか確認
curl http://localhost:5002/health

# 起動していなければ、別ターミナルで実行
cd backend
npm run dev
```

### Issue: コンポーネントが表示されない

**確認事項**:
1. ログイン状態か確認 → `http://localhost:3000/profile` でリダイレクトされない
2. インフルエンサーロールか確認 → プロフィールページが表示される
3. ブラウザコンソールでエラーがないか確認 (F12)

---

## 📊 テストチェックリスト

- [ ] バックエンドサーバーが起動している
- [ ] フロントエンドサーバーが起動している
- [ ] ビデオ情報取得 API が正常に動作（cURL テスト成功）
- [ ] URL バリデーション API が正常に動作（エラーが返される）
- [ ] ブラウザでログインできる
- [ ] プロフィールページにアクセスできる
- [ ] TikTok セクションが表示される
- [ ] ビデオ URL を入力できる
- [ ] 「動画情報を取得」ボタンが動作する
- [ ] ビデオプレビューが表示される
- [ ] 「このアカウントを認証」ボタンが動作する
- [ ] 成功メッセージが表示される
- [ ] TikTok アカウントマネージャーが表示される
- [ ] 「更新」ボタンが動作する
- [ ] 「削除」ボタンが動作する

---

## 📚 次のステップ

テストが完了したら：

1. **詳細ドキュメント参照**
   - `TIKTOK_INTEGRATION.md` - API 詳細仕様
   - `TIKTOK_TESTING_GUIDE.md` - 詳細なテストガイド

2. **本番環境へのデプロイ**
   - 本番環境の環境変数を設定
   - バックエンド・フロントエンドをデプロイ

3. **機能拡張**
   - 複数ビデオのエンゲージメント率集計
   - 定期的な自動同期
   - TikTok Official API との統合

---

## 📞 サポート

問題が発生した場合：

1. **ブラウザコンソール** (F12) でエラーを確認
2. **バックエンドログ** でサーバー側のエラーを確認
3. **このドキュメント** の トラブルシューティング を参照
4. **TIKTOK_TESTING_GUIDE.md** でさらに詳細なテスト手順を確認

---

**実装完了**: 2024 年 11 月 29 日 ✅

テストを実行して、動作確認をしてください！
