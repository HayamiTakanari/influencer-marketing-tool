"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVideos = exports.getUserFollowers = exports.getUserVideosStats = exports.getUserInfo = exports.deleteAccount = exports.syncAccount = exports.getAccountStats = exports.verifyAndAddAccount = exports.getUserInfoFromVideo = exports.getVideoInfo = void 0;
const client_1 = require("@prisma/client");
const tiktok_service_1 = require("../services/tiktok.service");
const prisma = new client_1.PrismaClient();
const tiktokService = new tiktok_service_1.TikTokService();
/**
 * Get TikTok video information
 * POST /api/tiktok/video-info
 * Body: { videoUrl: string }
 */
const getVideoInfo = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ error: 'videoUrl is required' });
        }
        if (!tiktokService.isValidTikTokUrl(videoUrl)) {
            return res.status(400).json({ error: 'Invalid TikTok URL' });
        }
        const videoData = await tiktokService.getVideoInfo(videoUrl);
        res.json({
            success: true,
            data: videoData,
        });
    }
    catch (error) {
        console.error('Get TikTok video info error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok video information',
            message: error.message,
        });
    }
};
exports.getVideoInfo = getVideoInfo;
/**
 * Get user info from TikTok video
 * POST /api/tiktok/user-info
 * Body: { videoUrl: string }
 */
const getUserInfoFromVideo = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ error: 'videoUrl is required' });
        }
        if (!tiktokService.isValidTikTokUrl(videoUrl)) {
            return res.status(400).json({ error: 'Invalid TikTok URL' });
        }
        const userInfo = await tiktokService.getUserInfo(videoUrl);
        res.json({
            success: true,
            data: userInfo,
        });
    }
    catch (error) {
        console.error('Get TikTok user info error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok user information',
            message: error.message,
        });
    }
};
exports.getUserInfoFromVideo = getUserInfoFromVideo;
/**
 * Verify TikTok account and save it to profile
 * POST /api/tiktok/verify-account
 * Body: { videoUrl: string, displayName?: string } OR { username: string, displayName?: string }
 */
const verifyAndAddAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { videoUrl, username, displayName } = req.body;
        let userInfo;
        // Handle both video URL (legacy) and username (new approach)
        if (username) {
            // Username-only approach: no need to validate video URL
            userInfo = await tiktokService.getUserInfoByUsername(username);
        }
        else if (videoUrl) {
            // Legacy video URL approach
            if (!tiktokService.isValidTikTokUrl(videoUrl)) {
                return res.status(400).json({ error: 'Invalid TikTok URL' });
            }
            // Get user info from the video
            userInfo = await tiktokService.getUserInfo(videoUrl);
        }
        else {
            return res.status(400).json({ error: 'Either username or videoUrl is required' });
        }
        // Find or create influencer profile
        let influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            influencer = await prisma.influencer.create({
                data: {
                    userId,
                    displayName: displayName || userInfo.nickname,
                    isRegistered: false,
                },
            });
        }
        // Check if TikTok account already exists
        let socialAccount = await prisma.socialAccount.findUnique({
            where: {
                influencerId_platform: {
                    influencerId: influencer.id,
                    platform: 'TIKTOK',
                },
            },
        });
        if (socialAccount) {
            // Update existing account
            socialAccount = await prisma.socialAccount.update({
                where: { id: socialAccount.id },
                data: {
                    username: userInfo.username,
                    profileUrl: `https://www.tiktok.com/@${userInfo.username}`,
                    isVerified: true,
                    lastSynced: new Date(),
                },
            });
        }
        else {
            // Create new account
            socialAccount = await prisma.socialAccount.create({
                data: {
                    influencerId: influencer.id,
                    platform: 'TIKTOK',
                    username: userInfo.username,
                    profileUrl: `https://www.tiktok.com/@${userInfo.username}`,
                    isVerified: true,
                    isConnected: true,
                    lastSynced: new Date(),
                },
            });
        }
        res.json({
            success: true,
            data: {
                socialAccount,
                userInfo,
            },
            message: 'TikTok account verified and added successfully',
        });
    }
    catch (error) {
        console.error('Verify TikTok account error:', error);
        res.status(500).json({
            error: 'Failed to verify TikTok account',
            message: error.message,
        });
    }
};
exports.verifyAndAddAccount = verifyAndAddAccount;
/**
 * Get TikTok account stats
 * GET /api/tiktok/account/:socialAccountId/stats
 */
const getAccountStats = async (req, res) => {
    try {
        const { socialAccountId } = req.params;
        const socialAccount = await prisma.socialAccount.findUnique({
            where: { id: socialAccountId },
        });
        if (!socialAccount) {
            return res.status(404).json({ error: 'Social account not found' });
        }
        if (socialAccount.platform !== 'TIKTOK') {
            return res.status(400).json({ error: 'This is not a TikTok account' });
        }
        // For now, return the stored stats
        // In a production app, you might want to sync fresh data from API
        res.json({
            success: true,
            data: {
                username: socialAccount.username,
                followerCount: socialAccount.followerCount,
                engagementRate: socialAccount.engagementRate,
                isVerified: socialAccount.isVerified,
                lastSynced: socialAccount.lastSynced,
            },
        });
    }
    catch (error) {
        console.error('Get TikTok stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok stats',
            message: error.message,
        });
    }
};
exports.getAccountStats = getAccountStats;
/**
 * Sync TikTok account data
 * POST /api/tiktok/sync/:socialAccountId
 */
const syncAccount = async (req, res) => {
    try {
        const { socialAccountId } = req.params;
        const socialAccount = await prisma.socialAccount.findUnique({
            where: { id: socialAccountId },
        });
        if (!socialAccount) {
            return res.status(404).json({ error: 'Social account not found' });
        }
        if (socialAccount.platform !== 'TIKTOK') {
            return res.status(400).json({ error: 'This is not a TikTok account' });
        }
        try {
            const userInfo = await tiktokService.getUserInfo(socialAccount.profileUrl);
            // Update account with fresh data
            const updatedAccount = await prisma.socialAccount.update({
                where: { id: socialAccountId },
                data: {
                    username: userInfo.username,
                    lastSynced: new Date(),
                },
            });
            res.json({
                success: true,
                data: updatedAccount,
                message: 'TikTok account synced successfully',
            });
        }
        catch (syncError) {
            console.warn('TikTok sync error:', syncError.message);
            // Return error but don't fail completely
            res.status(200).json({
                success: false,
                data: socialAccount,
                message: `Sync failed: ${syncError.message}`,
                note: 'For complete TikTok stats, consider using the official TikTok API',
            });
        }
    }
    catch (error) {
        console.error('Sync TikTok account error:', error);
        res.status(500).json({
            error: 'Failed to sync TikTok account',
            message: error.message,
        });
    }
};
exports.syncAccount = syncAccount;
/**
 * Delete TikTok account from profile
 * DELETE /api/tiktok/account/:socialAccountId
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { socialAccountId } = req.params;
        const socialAccount = await prisma.socialAccount.findUnique({
            where: { id: socialAccountId },
            include: {
                influencer: true,
            },
        });
        if (!socialAccount) {
            return res.status(404).json({ error: 'Social account not found' });
        }
        // Verify ownership
        if (socialAccount.influencer.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (socialAccount.platform !== 'TIKTOK') {
            return res.status(400).json({ error: 'This is not a TikTok account' });
        }
        await prisma.socialAccount.delete({
            where: { id: socialAccountId },
        });
        res.json({
            success: true,
            message: 'TikTok account deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete TikTok account error:', error);
        res.status(500).json({
            error: 'Failed to delete TikTok account',
            message: error.message,
        });
    }
};
exports.deleteAccount = deleteAccount;
/**
 * Get TikTok user information by username
 * GET /api/tiktok/user/:username
 */
const getUserInfo = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const userInfo = await tiktokService.getUserInfoByUsername(username);
        res.json({
            success: true,
            data: userInfo,
        });
    }
    catch (error) {
        console.error('Get TikTok user info error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok user information',
            message: error.message,
        });
    }
};
exports.getUserInfo = getUserInfo;
/**
 * Get TikTok user videos statistics
 * GET /api/tiktok/user/:username/videos-stats
 */
const getUserVideosStats = async (req, res) => {
    try {
        const { username } = req.params;
        const { maxVideos = 10 } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const stats = await tiktokService.getUserVideosStats(username, parseInt(maxVideos) || 10);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Get TikTok user videos stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok user videos statistics',
            message: error.message,
        });
    }
};
exports.getUserVideosStats = getUserVideosStats;
/**
 * Get TikTok user follower information
 * GET /api/tiktok/user/:username/followers
 */
const getUserFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const followerInfo = await tiktokService.getUserFollowerList(username);
        res.json({
            success: true,
            data: followerInfo,
        });
    }
    catch (error) {
        console.error('Get TikTok user followers error:', error);
        res.status(500).json({
            error: 'Failed to fetch TikTok user follower information',
            message: error.message,
        });
    }
};
exports.getUserFollowers = getUserFollowers;
/**
 * Search TikTok videos by keyword
 * GET /api/tiktok/search
 * Query params: keyword, maxResults
 */
const searchVideos = async (req, res) => {
    try {
        const { keyword, maxResults = 10 } = req.query;
        if (!keyword) {
            return res.status(400).json({ error: 'Keyword is required' });
        }
        const results = await tiktokService.searchVideos(keyword, parseInt(maxResults) || 10);
        res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        console.error('Search TikTok videos error:', error);
        res.status(500).json({
            error: 'Failed to search TikTok videos',
            message: error.message,
        });
    }
};
exports.searchVideos = searchVideos;
//# sourceMappingURL=tiktok.controller.js.map