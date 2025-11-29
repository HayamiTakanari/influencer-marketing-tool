"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndAddAccount = exports.getChannelStats = exports.getChannelInfo = void 0;
const client_1 = require("@prisma/client");
const youtube_service_1 = require("../services/youtube.service");
const prisma = new client_1.PrismaClient();
const youtubeService = new youtube_service_1.YouTubeService();
/**
 * Get YouTube channel information by username/handle
 * GET /api/youtube/channel/:username
 */
const getChannelInfo = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const channelInfo = await youtubeService.getChannelInfoByUsername(username);
        res.json({
            success: true,
            data: channelInfo,
        });
    }
    catch (error) {
        console.error('Get YouTube channel info error:', error);
        res.status(500).json({
            error: 'Failed to fetch YouTube channel information',
            message: error.message,
        });
    }
};
exports.getChannelInfo = getChannelInfo;
/**
 * Get YouTube channel statistics
 * GET /api/youtube/channel/:username/stats
 */
const getChannelStats = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const stats = await youtubeService.getChannelStats(username);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Get YouTube channel stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch YouTube channel statistics',
            message: error.message,
        });
    }
};
exports.getChannelStats = getChannelStats;
/**
 * Verify YouTube channel and save it to profile
 * POST /api/youtube/verify-account
 * Body: { username: string, displayName?: string }
 */
const verifyAndAddAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { username, displayName } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'username is required' });
        }
        // Get channel info
        const channelInfo = await youtubeService.getChannelInfoByUsername(username);
        // Find or create influencer profile
        let influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            influencer = await prisma.influencer.create({
                data: {
                    userId,
                    displayName: displayName || channelInfo.username,
                    isRegistered: false,
                },
            });
        }
        // Check if YouTube account already exists
        let socialAccount = await prisma.socialAccount.findUnique({
            where: {
                influencerId_platform: {
                    influencerId: influencer.id,
                    platform: 'YOUTUBE',
                },
            },
        });
        if (socialAccount) {
            // Update existing account
            socialAccount = await prisma.socialAccount.update({
                where: { id: socialAccount.id },
                data: {
                    username: channelInfo.username,
                    profileUrl: `https://www.youtube.com/@${channelInfo.username}`,
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
                    platform: 'YOUTUBE',
                    username: channelInfo.username,
                    profileUrl: `https://www.youtube.com/@${channelInfo.username}`,
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
                channelInfo,
            },
            message: 'YouTube channel verified and added successfully',
        });
    }
    catch (error) {
        console.error('Verify YouTube account error:', error);
        res.status(500).json({
            error: 'Failed to verify YouTube channel',
            message: error.message,
        });
    }
};
exports.verifyAndAddAccount = verifyAndAddAccount;
//# sourceMappingURL=youtube.controller.js.map