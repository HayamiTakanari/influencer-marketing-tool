"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWatchlistNotes = exports.isInWatchlist = exports.getWatchlist = exports.removeFromWatchlist = exports.addToWatchlist = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 2-7: Add project to watchlist
const addToWatchlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId } = req.body;
        if (!userId || !projectId) {
            return res.status(400).json({ error: 'ユーザーIDとプロジェクトIDが必須です' });
        }
        // Get influencer ID
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみがこの操作を実行できます' });
        }
        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            return res.status(404).json({ error: 'プロジェクトが見つかりません' });
        }
        // Check if already in watchlist
        const existingWatchlist = await prisma.watchlist.findUnique({
            where: {
                influencerId_projectId: {
                    influencerId: influencer.id,
                    projectId,
                },
            },
        });
        if (existingWatchlist) {
            return res.status(400).json({ error: 'すでにウォッチリストに追加されています' });
        }
        // Add to watchlist
        const watchlist = await prisma.watchlist.create({
            data: {
                influencerId: influencer.id,
                projectId,
                notes: req.body.notes || null,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        budget: true,
                    },
                },
            },
        });
        // Create notification
        const client = await prisma.client.findUnique({
            where: { id: project.clientId },
        });
        if (client) {
            await prisma.notification.create({
                data: {
                    userId: client.userId,
                    type: 'PROJECT_MATCHED',
                    title: 'ウォッチリスト登録',
                    message: `インフルエンサーがプロジェクト「${project.title}」をウォッチリストに追加しました`,
                    data: {
                        projectId,
                        influencerId: influencer.id,
                    },
                },
            });
        }
        res.status(201).json({
            message: 'ウォッチリストに追加しました',
            watchlist,
        });
    }
    catch (error) {
        console.error('ウォッチリスト追加エラー:', error);
        res.status(500).json({ error: 'ウォッチリストの追加に失敗しました' });
    }
};
exports.addToWatchlist = addToWatchlist;
// Chapter 2-7: Remove project from watchlist
const removeFromWatchlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { watchlistId } = req.params;
        if (!userId || !watchlistId) {
            return res.status(400).json({ error: 'ユーザーIDとウォッチリストIDが必須です' });
        }
        // Get influencer ID
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみがこの操作を実行できます' });
        }
        // Find and delete watchlist
        const watchlist = await prisma.watchlist.findUnique({
            where: { id: watchlistId },
        });
        if (!watchlist) {
            return res.status(404).json({ error: 'ウォッチリストが見つかりません' });
        }
        if (watchlist.influencerId !== influencer.id) {
            return res.status(403).json({ error: '権限がありません' });
        }
        await prisma.watchlist.delete({
            where: { id: watchlistId },
        });
        res.json({ message: 'ウォッチリストから削除しました' });
    }
    catch (error) {
        console.error('ウォッチリスト削除エラー:', error);
        res.status(500).json({ error: 'ウォッチリストの削除に失敗しました' });
    }
};
exports.removeFromWatchlist = removeFromWatchlist;
// Chapter 2-7: Get influencer's watchlist
const getWatchlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '認証が必要です' });
        }
        // Get influencer ID
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみがこの操作を実行できます' });
        }
        // Get watchlist
        const watchlists = await prisma.watchlist.findMany({
            where: { influencerId: influencer.id },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        budget: true,
                        targetPlatforms: true,
                        targetPrefecture: true,
                        status: true,
                        startDate: true,
                        endDate: true,
                        isPublic: true,
                    },
                },
            },
            orderBy: { savedAt: 'desc' },
        });
        res.json({
            count: watchlists.length,
            watchlists,
        });
    }
    catch (error) {
        console.error('ウォッチリスト取得エラー:', error);
        res.status(500).json({ error: 'ウォッチリストの取得に失敗しました' });
    }
};
exports.getWatchlist = getWatchlist;
// Chapter 2-7: Check if project is in watchlist
const isInWatchlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId } = req.params;
        if (!userId || !projectId) {
            return res.status(400).json({ error: 'ユーザーIDとプロジェクトIDが必須です' });
        }
        // Get influencer ID
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみがこの操作を実行できます' });
        }
        // Check watchlist
        const watchlist = await prisma.watchlist.findUnique({
            where: {
                influencerId_projectId: {
                    influencerId: influencer.id,
                    projectId,
                },
            },
        });
        res.json({
            isInWatchlist: !!watchlist,
            watchlistId: watchlist?.id || null,
        });
    }
    catch (error) {
        console.error('ウォッチリスト確認エラー:', error);
        res.status(500).json({ error: 'ウォッチリストの確認に失敗しました' });
    }
};
exports.isInWatchlist = isInWatchlist;
// Chapter 2-7: Update watchlist notes
const updateWatchlistNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { watchlistId } = req.params;
        const { notes } = req.body;
        if (!userId || !watchlistId) {
            return res.status(400).json({ error: 'ユーザーIDとウォッチリストIDが必須です' });
        }
        // Get influencer ID
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサーのみがこの操作を実行できます' });
        }
        // Find watchlist
        const watchlist = await prisma.watchlist.findUnique({
            where: { id: watchlistId },
        });
        if (!watchlist) {
            return res.status(404).json({ error: 'ウォッチリストが見つかりません' });
        }
        if (watchlist.influencerId !== influencer.id) {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Update notes
        const updated = await prisma.watchlist.update({
            where: { id: watchlistId },
            data: { notes },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        res.json({
            message: 'メモを更新しました',
            watchlist: updated,
        });
    }
    catch (error) {
        console.error('ウォッチリストメモ更新エラー:', error);
        res.status(500).json({ error: 'メモの更新に失敗しました' });
    }
};
exports.updateWatchlistNotes = updateWatchlistNotes;
//# sourceMappingURL=watchlist.controller.js.map