"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tiktok_auth_controller_1 = require("../controllers/tiktok-auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * Chapter 1-6: TikTok 認証エンドポイント
 */
// POST /api/sns/tiktok/authenticate
// TikTok アカウントを認証
// Body: { tikTokUsername: string }
// 認証ユーザーのみアクセス可能
router.post('/tiktok/authenticate', auth_1.authenticate, tiktok_auth_controller_1.authenticateTikTokAccount);
// GET /api/sns/tiktok/status
// TikTok アカウント認証状態を確認
// 認証ユーザーのみアクセス可能
router.get('/tiktok/status', auth_1.authenticate, tiktok_auth_controller_1.getTikTokStatus);
// DELETE /api/sns/tiktok
// TikTok アカウント認証を削除
// 認証ユーザーのみアクセス可能
router.delete('/tiktok', auth_1.authenticate, tiktok_auth_controller_1.removeTikTok);
/**
 * テスト用エンドポイント
 */
// GET /api/sns/tiktok/user?username=<username>
// TikTok ユーザー情報を直接取得（認証不要 - テスト用）
router.get('/tiktok/user', tiktok_auth_controller_1.getTikTokUserData);
/**
 * 管理者用エンドポイント
 */
// POST /api/sns/tiktok/update-followers
// すべてのインフルエンサーの TikTok フォロワー数を更新
// 管理者のみアクセス可能
router.post('/tiktok/update-followers', auth_1.authenticate, tiktok_auth_controller_1.updateAllTikTokFollowerCounts);
exports.default = router;
//# sourceMappingURL=tiktok-auth.routes.js.map