"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndAddAccount = exports.getUserStats = exports.getUserInfo = void 0;
const client_1 = require("@prisma/client");
const twitter_service_1 = require("../services/twitter.service");
const prisma = new client_1.PrismaClient();
const twitterService = new twitter_service_1.TwitterService();
/**
 * Get Twitter user information by username
 * GET /api/twitter/user/:username
 */
const getUserInfo = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const userInfo = await twitterService.getUserInfoByUsername(username);
        res.json({
            success: true,
            data: userInfo,
        });
    }
    catch (error) {
        console.error('Get Twitter user info error:', error);
        res.status(500).json({
            error: 'Failed to fetch Twitter user information',
            message: error.message,
        });
    }
};
exports.getUserInfo = getUserInfo;
/**
 * Get Twitter user statistics
 * GET /api/twitter/user/:username/stats
 */
const getUserStats = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const stats = await twitterService.getUserStats(username);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Get Twitter user stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch Twitter user statistics',
            message: error.message,
        });
    }
};
exports.getUserStats = getUserStats;
/**
 * Verify Twitter account and save it to profile
 * POST /api/twitter/verify-account
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
        // Get user info
        const userInfo = await twitterService.getUserInfoByUsername(username);
        // Find or create influencer profile
        let influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            influencer = await prisma.influencer.create({
                data: {
                    userId,
                    displayName: displayName || userInfo.username,
                    isRegistered: false,
                },
            });
        }
        // Check if Twitter account already exists
        let socialAccount = await prisma.socialAccount.findUnique({
            where: {
                influencerId_platform: {
                    influencerId: influencer.id,
                    platform: 'TWITTER',
                },
            },
        });
        if (socialAccount) {
            // Update existing account
            socialAccount = await prisma.socialAccount.update({
                where: { id: socialAccount.id },
                data: {
                    username: userInfo.username,
                    profileUrl: `https://twitter.com/${userInfo.username}`,
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
                    platform: 'TWITTER',
                    username: userInfo.username,
                    profileUrl: `https://twitter.com/${userInfo.username}`,
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
            message: 'Twitter account verified and added successfully',
        });
    }
    catch (error) {
        console.error('Verify Twitter account error:', error);
        res.status(500).json({
            error: 'Failed to verify Twitter account',
            message: error.message,
        });
    }
};
exports.verifyAndAddAccount = verifyAndAddAccount;
//# sourceMappingURL=twitter.controller.js.map