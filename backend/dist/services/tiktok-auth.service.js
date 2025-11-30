"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEngagementRate = exports.removeTikTokAccount = exports.updateTikTokFollowerCount = exports.getTikTokAccountStatus = exports.saveTikTokAccount = exports.getTikTokUserInfo = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// RapidAPI TikTok 設定
const RAPIDAPI_HOST = 'tiktok-api.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'fffeeba8fbmsh3f25e93bda6a2b3p164cb2jsn76d173bc25df';
/**
 * RapidAPI を使用して TikTok ユーザー情報を取得
 * Chapter 1-6: SNS認証（TikTok）
 */
const getTikTokUserInfo = async (username) => {
    try {
        console.log(`Fetching TikTok user info for: ${username}`);
        // RapidAPI endpoint: TikTok user info
        const options = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/user/info`,
            params: {
                uniqueId: username.toLowerCase(), // TikTok username
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        };
        const response = await axios_1.default.request(options);
        if (!response.data || !response.data.userInfo) {
            throw new Error('Invalid TikTok user data');
        }
        const userInfo = response.data.userInfo.user;
        const stats = response.data.userInfo.stats;
        // TikTok API から取得したデータを標準形式に変換
        const tikTokUserInfo = {
            id: userInfo.id || userInfo.uniqueId,
            username: userInfo.uniqueId,
            displayName: userInfo.nickname,
            profileImageUrl: userInfo.avatarMedium || userInfo.avatarLarger,
            followerCount: stats.followerCount || 0,
            followingCount: stats.followingCount || 0,
            videoCount: stats.videoCount || 0,
            bio: userInfo.signature || userInfo.bio,
            verified: userInfo.verified || false,
            isPrivate: userInfo.privateAccount || false,
        };
        console.log(`✓ TikTok user info retrieved: ${tikTokUserInfo.username}`);
        return tikTokUserInfo;
    }
    catch (error) {
        console.error('Error fetching TikTok user info:', error);
        if (axios_1.default.isAxiosError(error)) {
            if (error.response?.status === 404) {
                throw new Error('TikTok user not found');
            }
            if (error.response?.status === 429) {
                throw new Error('TikTok API rate limit exceeded');
            }
            throw new Error(`TikTok API error: ${error.response?.statusText || error.message}`);
        }
        throw error;
    }
};
exports.getTikTokUserInfo = getTikTokUserInfo;
/**
 * TikTok アカウントを SocialAccount に保存・更新
 * Chapter 1-6: SNS認証（TikTok）
 */
const saveTikTokAccount = async (influencerId, accountId // TikTok username
) => {
    try {
        // TikTok ユーザー情報を取得
        const tikTokUserInfo = await (0, exports.getTikTokUserInfo)(accountId);
        // インフルエンサープロフィールが存在するか確認
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
        });
        if (!influencer) {
            throw new Error('Influencer not found');
        }
        // 既存の TikTok アカウントをチェック
        const existingAccount = await prisma.socialAccount.findFirst({
            where: {
                influencerId,
                platform: 'TIKTOK',
            },
        });
        if (existingAccount) {
            // 既存アカウントを更新
            await prisma.socialAccount.update({
                where: { id: existingAccount.id },
                data: {
                    username: tikTokUserInfo.username,
                    profileUrl: `https://www.tiktok.com/@${tikTokUserInfo.username}`,
                    followerCount: tikTokUserInfo.followerCount,
                    isVerified: true,
                    isConnected: true,
                    platformUserId: tikTokUserInfo.id,
                    lastSynced: new Date(),
                },
            });
            console.log(`✓ TikTok account updated for influencer: ${influencerId}`);
        }
        else {
            // 新しいアカウントを作成
            await prisma.socialAccount.create({
                data: {
                    influencerId,
                    platform: 'TIKTOK',
                    username: tikTokUserInfo.username,
                    profileUrl: `https://www.tiktok.com/@${tikTokUserInfo.username}`,
                    followerCount: tikTokUserInfo.followerCount,
                    isVerified: true,
                    isConnected: true,
                    platformUserId: tikTokUserInfo.id,
                },
            });
            console.log(`✓ TikTok account created for influencer: ${influencerId}`);
        }
        // VerificationRecord を更新（SNS認証完了）
        await prisma.verificationRecord.upsert({
            where: {
                userId_type: {
                    userId: influencer.userId,
                    type: 'SNS',
                },
            },
            create: {
                userId: influencer.userId,
                type: 'SNS',
                status: 'APPROVED',
                verifiedAt: new Date(),
                metadata: {
                    platform: 'TIKTOK',
                    username: tikTokUserInfo.username,
                    followerCount: tikTokUserInfo.followerCount,
                    verifiedAt: new Date().toISOString(),
                },
            },
            update: {
                status: 'APPROVED',
                verifiedAt: new Date(),
                metadata: {
                    platform: 'TIKTOK',
                    username: tikTokUserInfo.username,
                    followerCount: tikTokUserInfo.followerCount,
                    verifiedAt: new Date().toISOString(),
                },
            },
        });
        console.log(`✓ Verification record updated for user: ${influencer.userId}`);
    }
    catch (error) {
        console.error('Error saving TikTok account:', error);
        throw error;
    }
};
exports.saveTikTokAccount = saveTikTokAccount;
/**
 * TikTok アカウント認証情報を取得
 */
const getTikTokAccountStatus = async (influencerId) => {
    try {
        const account = await prisma.socialAccount.findFirst({
            where: {
                influencerId,
                platform: 'TIKTOK',
            },
        });
        if (!account) {
            return { isVerified: false };
        }
        return {
            isVerified: account.isVerified,
            username: account.username,
            followerCount: account.followerCount,
            verifiedAt: account.lastSynced,
        };
    }
    catch (error) {
        console.error('Error getting TikTok account status:', error);
        throw error;
    }
};
exports.getTikTokAccountStatus = getTikTokAccountStatus;
/**
 * TikTok フォロワー数を更新（定期的に実行）
 */
const updateTikTokFollowerCount = async (influencerId) => {
    try {
        const account = await prisma.socialAccount.findFirst({
            where: {
                influencerId,
                platform: 'TIKTOK',
            },
        });
        if (!account) {
            throw new Error('TikTok account not found');
        }
        // TikTok ユーザー情報を再取得
        const tikTokUserInfo = await (0, exports.getTikTokUserInfo)(account.username);
        // フォロワー数を更新
        await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
                followerCount: tikTokUserInfo.followerCount,
                lastSynced: new Date(),
            },
        });
        console.log(`✓ TikTok follower count updated: ${account.username} (${tikTokUserInfo.followerCount})`);
    }
    catch (error) {
        console.error('Error updating TikTok follower count:', error);
        throw error;
    }
};
exports.updateTikTokFollowerCount = updateTikTokFollowerCount;
/**
 * TikTok アカウント認証を削除
 */
const removeTikTokAccount = async (influencerId) => {
    try {
        const account = await prisma.socialAccount.findFirst({
            where: {
                influencerId,
                platform: 'TIKTOK',
            },
        });
        if (account) {
            await prisma.socialAccount.delete({
                where: { id: account.id },
            });
            console.log(`✓ TikTok account removed for influencer: ${influencerId}`);
        }
    }
    catch (error) {
        console.error('Error removing TikTok account:', error);
        throw error;
    }
};
exports.removeTikTokAccount = removeTikTokAccount;
/**
 * エンゲージメント率を計算（補助関数）
 */
const calculateEngagementRate = async (username, followerCount) => {
    try {
        if (followerCount === 0)
            return 0;
        // RapidAPI を使用して最新のビデオ統計を取得
        const options = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/user/posts`,
            params: {
                uniqueId: username.toLowerCase(),
                count: 10, // 直近10件のビデオ
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        };
        const response = await axios_1.default.request(options);
        if (!response.data || !response.data.videos) {
            return 0;
        }
        const videos = response.data.videos;
        let totalEngagements = 0;
        videos.forEach((video) => {
            const likes = video.likeCount || 0;
            const comments = video.commentCount || 0;
            const shares = video.shareCount || 0;
            totalEngagements += likes + comments + shares;
        });
        const avgEngagementPerVideo = totalEngagements / Math.max(videos.length, 1);
        const engagementRate = (avgEngagementPerVideo / followerCount) * 100;
        return Math.round(engagementRate * 100) / 100; // 小数点第2位まで
    }
    catch (error) {
        console.error('Error calculating engagement rate:', error);
        return 0;
    }
};
exports.calculateEngagementRate = calculateEngagementRate;
//# sourceMappingURL=tiktok-auth.service.js.map