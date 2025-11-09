"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllInfluencers = exports.getSyncStatus = exports.syncAllMyAccounts = exports.syncSocialAccount = void 0;
const client_1 = require("@prisma/client");
const sns_service_1 = require("../services/sns.service");
const prisma = new client_1.PrismaClient();
const snsService = new sns_service_1.SNSSyncService();
const syncSocialAccount = async (req, res) => {
    try {
        const { socialAccountId } = req.params;
        const result = await snsService.syncSocialAccount(socialAccountId);
        res.json({
            message: 'Social account synced successfully',
            data: result,
        });
    }
    catch (error) {
        console.error('Sync social account error:', error);
        res.status(500).json({ error: 'Failed to sync social account' });
    }
};
exports.syncSocialAccount = syncSocialAccount;
const syncAllMyAccounts = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get influencer
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        const result = await snsService.syncAllInfluencerAccounts(influencer.id);
        res.json({
            message: 'All social accounts synced',
            data: result,
        });
    }
    catch (error) {
        console.error('Sync all accounts error:', error);
        res.status(500).json({ error: 'Failed to sync all accounts' });
    }
};
exports.syncAllMyAccounts = syncAllMyAccounts;
const getSyncStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole === 'ADMIN') {
            // Admin can see all influencers' sync status
            const allSocialAccounts = await prisma.socialAccount.findMany({
                include: {
                    influencer: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            res.json({
                totalAccounts: allSocialAccounts.length,
                accounts: allSocialAccounts,
            });
            return;
        }
        // Regular users see only their own accounts
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                socialAccounts: {
                    select: {
                        id: true,
                        platform: true,
                        username: true,
                        lastSynced: true,
                        followerCount: true,
                        engagementRate: true,
                        isVerified: true,
                    },
                },
            },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        res.json({
            totalAccounts: influencer.socialAccounts.length,
            accounts: influencer.socialAccounts,
        });
    }
    catch (error) {
        console.error('Get sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
};
exports.getSyncStatus = getSyncStatus;
// Admin endpoint to sync all influencers
const syncAllInfluencers = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // Get total number of influencers for progress tracking
        const totalInfluencers = await prisma.influencer.count({
            where: { isRegistered: true },
        });
        // Run sync in background
        snsService.scheduleSyncForAllInfluencers()
            .catch(error => console.error('Background sync error:', error));
        res.json({
            message: 'Sync started for all influencers',
            totalInfluencers,
        });
    }
    catch (error) {
        console.error('Sync all influencers error:', error);
        res.status(500).json({ error: 'Failed to start sync' });
    }
};
exports.syncAllInfluencers = syncAllInfluencers;
