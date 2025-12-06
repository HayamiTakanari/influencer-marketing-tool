import { Router } from 'express';
import {
  authenticateTikTokAccount,
  getTikTokStatus,
  removeTikTok,
  getTikTokUserData,
  updateAllTikTokFollowerCounts,
} from '../controllers/tiktok-auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Chapter 1-6: TikTok 認証エンドポイント
 */

// POST /api/sns/tiktok/authenticate
// TikTok アカウントを認証
// Body: { tikTokUsername: string }
// 認証ユーザーのみアクセス可能
router.post('/tiktok/authenticate', authenticate, authenticateTikTokAccount);

// GET /api/sns/tiktok/status
// TikTok アカウント認証状態を確認
// 認証ユーザーのみアクセス可能
router.get('/tiktok/status', authenticate, getTikTokStatus);

// DELETE /api/sns/tiktok
// TikTok アカウント認証を削除
// 認証ユーザーのみアクセス可能
router.delete('/tiktok', authenticate, removeTikTok);

/**
 * テスト用エンドポイント
 */

// GET /api/sns/tiktok/user?username=<username>
// TikTok ユーザー情報を直接取得（認証不要 - テスト用）
router.get('/tiktok/user', getTikTokUserData);

/**
 * 管理者用エンドポイント
 */

// POST /api/sns/tiktok/update-followers
// すべてのインフルエンサーの TikTok フォロワー数を更新
// 管理者のみアクセス可能
router.post('/tiktok/update-followers', authenticate, updateAllTikTokFollowerCounts);

export default router;
