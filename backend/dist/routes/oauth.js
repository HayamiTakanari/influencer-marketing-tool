"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// OAuth設定（環境変数から読み込み）
const oauthConfig = {
    instagram: {
        clientId: process.env.INSTAGRAM_CLIENT_ID || '',
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
        redirectUri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/oauth/instagram/callback',
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        apiUrl: 'https://graph.instagram.com',
    },
    youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || '',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth/youtube/callback',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        apiUrl: 'https://www.googleapis.com/youtube/v3',
    },
    tiktok: {
        clientKey: process.env.TIKTOK_CLIENT_KEY || '',
        clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
        redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/oauth/tiktok/callback',
        authUrl: 'https://www.tiktok.com/auth/authorize/',
        tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
        apiUrl: 'https://open-api.tiktok.com',
    },
    twitter: {
        clientId: process.env.TWITTER_CLIENT_ID || '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
        redirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3000/oauth/twitter/callback',
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        apiUrl: 'https://api.twitter.com/2',
    },
};
// 暗号化・復号化用の関数
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex'), 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV || crypto_1.default.randomBytes(16).toString('hex'), 'hex');
function encrypt(text) {
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
function decrypt(encrypted) {
    const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
// OAuth認証開始エンドポイント
router.get('/auth/:platform', auth_1.authenticate, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        // インフルエンサーのみアクセス可能
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { influencer: true },
        });
        if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
        }
        // state パラメータ（CSRF対策）
        const state = crypto_1.default.randomBytes(16).toString('hex');
        let authUrl = '';
        switch (platform.toLowerCase()) {
            case 'instagram':
                authUrl = `${oauthConfig.instagram.authUrl}?client_id=${oauthConfig.instagram.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.instagram.redirectUri)}&scope=user_profile,user_media&response_type=code&state=${state}`;
                break;
            case 'youtube':
                authUrl = `${oauthConfig.youtube.authUrl}?client_id=${oauthConfig.youtube.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.youtube.redirectUri)}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&state=${state}`;
                break;
            case 'tiktok':
                authUrl = `${oauthConfig.tiktok.authUrl}?client_key=${oauthConfig.tiktok.clientKey}&redirect_uri=${encodeURIComponent(oauthConfig.tiktok.redirectUri)}&scope=user.info.basic&response_type=code&state=${state}`;
                break;
            case 'twitter':
                authUrl = `${oauthConfig.twitter.authUrl}?client_id=${oauthConfig.twitter.clientId}&redirect_uri=${encodeURIComponent(oauthConfig.twitter.redirectUri)}&scope=users.read%20tweet.read&response_type=code&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
                break;
            default:
                return res.status(400).json({ error: 'サポートされていないプラットフォームです' });
        }
        res.json({ authUrl });
    }
    catch (error) {
        console.error('OAuth auth error:', error);
        res.status(500).json({ error: 'OAuth認証の開始に失敗しました' });
    }
});
// OAuth コールバックエンドポイント
router.post('/callback/:platform', auth_1.authenticate, async (req, res) => {
    try {
        const { platform } = req.params;
        const { code, state } = req.body;
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { influencer: true },
        });
        if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
        }
        // state 検証（CSRF対策）
        let tokenData = null;
        let userInfo = null;
        let platformEnum;
        switch (platform.toLowerCase()) {
            case 'instagram':
                platformEnum = client_1.Platform.INSTAGRAM;
                // Instagram のトークン取得
                const instagramResponse = await axios_1.default.post(oauthConfig.instagram.tokenUrl, {
                    client_id: oauthConfig.instagram.clientId,
                    client_secret: oauthConfig.instagram.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: oauthConfig.instagram.redirectUri,
                    code,
                });
                tokenData = instagramResponse.data;
                // ユーザー情報取得
                const instagramUser = await axios_1.default.get(`${oauthConfig.instagram.apiUrl}/me`, {
                    params: {
                        fields: 'id,username,account_type,media_count',
                        access_token: tokenData.access_token,
                    },
                });
                userInfo = instagramUser.data;
                break;
            case 'youtube':
                platformEnum = client_1.Platform.YOUTUBE;
                // YouTube のトークン取得
                const youtubeResponse = await axios_1.default.post(oauthConfig.youtube.tokenUrl, {
                    client_id: oauthConfig.youtube.clientId,
                    client_secret: oauthConfig.youtube.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: oauthConfig.youtube.redirectUri,
                    code,
                });
                tokenData = youtubeResponse.data;
                // チャンネル情報取得
                const youtubeChannel = await axios_1.default.get(`${oauthConfig.youtube.apiUrl}/channels`, {
                    params: {
                        part: 'snippet,statistics',
                        mine: true,
                    },
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });
                userInfo = youtubeChannel.data.items[0];
                break;
            case 'tiktok':
                platformEnum = client_1.Platform.TIKTOK;
                // TikTok のトークン取得
                const tiktokResponse = await axios_1.default.post(oauthConfig.tiktok.tokenUrl, {
                    client_key: oauthConfig.tiktok.clientKey,
                    client_secret: oauthConfig.tiktok.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: oauthConfig.tiktok.redirectUri,
                    code,
                });
                tokenData = tiktokResponse.data;
                // ユーザー情報取得
                const tiktokUser = await axios_1.default.get(`${oauthConfig.tiktok.apiUrl}/user/info/`, {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });
                userInfo = tiktokUser.data.data.user;
                break;
            case 'twitter':
                platformEnum = client_1.Platform.TWITTER;
                // Twitter のトークン取得
                const twitterResponse = await axios_1.default.post(oauthConfig.twitter.tokenUrl, {
                    client_id: oauthConfig.twitter.clientId,
                    client_secret: oauthConfig.twitter.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: oauthConfig.twitter.redirectUri,
                    code,
                    code_verifier: 'challenge', // 実際は適切な PKCE を実装
                });
                tokenData = twitterResponse.data;
                // ユーザー情報取得
                const twitterUser = await axios_1.default.get(`${oauthConfig.twitter.apiUrl}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                });
                userInfo = twitterUser.data.data;
                break;
            default:
                return res.status(400).json({ error: 'サポートされていないプラットフォームです' });
        }
        // SocialAccount を更新または作成
        const socialAccount = await prisma.socialAccount.upsert({
            where: {
                influencerId_platform: {
                    influencerId: user.influencer.id,
                    platform: platformEnum,
                },
            },
            update: {
                username: userInfo.username || userInfo.snippet?.title || userInfo.display_name,
                followerCount: userInfo.follower_count ||
                    userInfo.statistics?.subscriberCount ||
                    userInfo.public_metrics?.followers_count ||
                    0,
                lastSynced: new Date(),
            },
            create: {
                influencerId: user.influencer.id,
                platform: platformEnum,
                username: userInfo.username || userInfo.snippet?.title || userInfo.display_name,
                profileUrl: `https://${platform.toLowerCase()}.com/${userInfo.username || userInfo.id}`,
                followerCount: userInfo.follower_count ||
                    userInfo.statistics?.subscriberCount ||
                    userInfo.public_metrics?.followers_count ||
                    0,
                isVerified: userInfo.is_verified || false,
            },
        });
        res.json({
            success: true,
            platform,
            username: socialAccount.username,
            followerCount: socialAccount.followerCount,
        });
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ error: 'OAuth認証に失敗しました' });
    }
});
// SNSアカウント連携解除
router.delete('/disconnect/:platform', auth_1.authenticate, async (req, res) => {
    try {
        const { platform } = req.params;
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { influencer: true },
        });
        if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
        }
        const platformEnum = client_1.Platform[platform.toUpperCase()];
        await prisma.socialAccount.update({
            where: {
                influencerId_platform: {
                    influencerId: user.influencer.id,
                    platform: platformEnum,
                },
            },
            data: {
                isVerified: false,
            },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: '連携解除に失敗しました' });
    }
});
// SNSアカウント連携状態確認
router.get('/status', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                influencer: {
                    include: {
                        socialAccounts: true,
                    },
                },
            },
        });
        if (!user || user.role !== 'INFLUENCER' || !user.influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみアクセス可能です' });
        }
        const connectionStatus = user.influencer.socialAccounts.map(account => ({
            platform: account.platform,
            username: account.username,
            followerCount: account.followerCount,
            lastSynced: account.lastSynced,
        }));
        res.json({ connectionStatus });
    }
    catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'ステータス確認に失敗しました' });
    }
});
exports.default = router;
//# sourceMappingURL=oauth.js.map