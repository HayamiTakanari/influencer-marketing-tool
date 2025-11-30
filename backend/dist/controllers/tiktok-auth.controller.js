"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAllTikTokFollowerCounts = exports.getTikTokUserData = exports.removeTikTok = exports.getTikTokStatus = exports.authenticateTikTokAccount = void 0;
const tiktok_auth_service_1 = require("../services/tiktok-auth.service");
/**
 * Chapter 1-6: TikTok アカウント認証
 * ユーザーが入力した TikTok ユーザーID を検証して認証
 */
const authenticateTikTokAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { tikTokUsername } = req.body;
        // バリデーション
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!tikTokUsername || typeof tikTokUsername !== 'string') {
            res.status(400).json({ error: 'TikTok username is required' });
            return;
        }
        // TikTok ユーザー名をバリデーション（英数字、アンダースコア、ドットのみ許可）
        if (!/^[a-zA-Z0-9._]{2,24}$/.test(tikTokUsername)) {
            res.status(400).json({
                error: 'Invalid TikTok username format. Use 2-24 characters (letters, numbers, . or _)',
            });
            return;
        }
        console.log(`Authenticating TikTok account: ${tikTokUsername} for user: ${userId}`);
        // TikTok ユーザー情報を取得
        const tikTokUserInfo = await (0, tiktok_auth_service_1.getTikTokUserInfo)(tikTokUsername);
        // ユーザー情報をデータベースに保存
        await (0, tiktok_auth_service_1.saveTikTokAccount)(userId, tikTokUserInfo.username);
        res.status(200).json({
            message: 'TikTok account authenticated successfully',
            account: {
                username: tikTokUserInfo.username,
                displayName: tikTokUserInfo.displayName,
                followerCount: tikTokUserInfo.followerCount,
                followingCount: tikTokUserInfo.followingCount,
                videoCount: tikTokUserInfo.videoCount,
                verified: tikTokUserInfo.verified,
                profileUrl: `https://www.tiktok.com/@${tikTokUserInfo.username}`,
            },
        });
    }
    catch (error) {
        console.error('TikTok authentication error:', error);
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                res.status(404).json({
                    error: 'TikTok account not found. Please check the username.',
                });
                return;
            }
            if (error.message.includes('rate limit')) {
                res.status(429).json({
                    error: 'API rate limit exceeded. Please try again later.',
                });
                return;
            }
            if (error.message.includes('Influencer not found')) {
                res.status(404).json({
                    error: 'Influencer profile not found',
                });
                return;
            }
        }
        res.status(500).json({ error: 'Failed to authenticate TikTok account' });
    }
};
exports.authenticateTikTokAccount = authenticateTikTokAccount;
/**
 * Chapter 1-6: TikTok アカウント状態確認
 */
const getTikTokStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // ユーザーの Influencer プロフィールを取得
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { influencer: true },
        });
        if (!user?.influencer) {
            res.status(400).json({ error: 'Influencer profile not found' });
            return;
        }
        // TikTok アカウント状態を取得
        const status = await (0, tiktok_auth_service_1.getTikTokAccountStatus)(user.influencer.id);
        res.json({
            isVerified: status.isVerified,
            account: status.isVerified
                ? {
                    username: status.username,
                    followerCount: status.followerCount,
                    verifiedAt: status.verifiedAt,
                }
                : null,
        });
    }
    catch (error) {
        console.error('Error getting TikTok status:', error);
        res.status(500).json({ error: 'Failed to get TikTok account status' });
    }
};
exports.getTikTokStatus = getTikTokStatus;
/**
 * Chapter 1-6: TikTok アカウント認証を削除
 */
const removeTikTok = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { influencer: true },
        });
        if (!user?.influencer) {
            res.status(400).json({ error: 'Influencer profile not found' });
            return;
        }
        // TikTok アカウント認証を削除
        await (0, tiktok_auth_service_1.removeTikTokAccount)(user.influencer.id);
        res.json({
            message: 'TikTok account removed successfully',
        });
    }
    catch (error) {
        console.error('Error removing TikTok account:', error);
        res.status(500).json({ error: 'Failed to remove TikTok account' });
    }
};
exports.removeTikTok = removeTikTok;
/**
 * Chapter 1-6: TikTok ユーザー情報を直接取得（テスト用）
 */
const getTikTokUserData = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username || typeof username !== 'string') {
            res.status(400).json({ error: 'Username query parameter is required' });
            return;
        }
        const userInfo = await (0, tiktok_auth_service_1.getTikTokUserInfo)(username);
        res.json({
            user: userInfo,
        });
    }
    catch (error) {
        console.error('Error fetching TikTok user data:', error);
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: 'TikTok user not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to fetch TikTok user data' });
    }
};
exports.getTikTokUserData = getTikTokUserData;
/**
 * 管理者用: TikTok フォロワー数を一括更新
 */
const updateAllTikTokFollowerCounts = async (req, res) => {
    try {
        // 管理者権限チェック
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Only admins can perform this action' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        // すべてのインフルエンサーの TikTok アカウントを取得
        const tikTokAccounts = await prisma.socialAccount.findMany({
            where: { platform: 'TIKTOK', isVerified: true },
            include: { influencer: true },
        });
        console.log(`Updating ${tikTokAccounts.length} TikTok accounts`);
        const results = [];
        for (const account of tikTokAccounts) {
            try {
                await (0, tiktok_auth_service_1.updateTikTokFollowerCount)(account.influencer.id);
                results.push({
                    username: account.username,
                    status: 'success',
                });
            }
            catch (error) {
                console.error(`Failed to update ${account.username}:`, error);
                results.push({
                    username: account.username,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        res.json({
            message: `Updated ${results.filter((r) => r.status === 'success').length}/${results.length} accounts`,
            results,
        });
    }
    catch (error) {
        console.error('Error updating TikTok follower counts:', error);
        res.status(500).json({ error: 'Failed to update TikTok follower counts' });
    }
};
exports.updateAllTikTokFollowerCounts = updateAllTikTokFollowerCounts;
//# sourceMappingURL=tiktok-auth.controller.js.map