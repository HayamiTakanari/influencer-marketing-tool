"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFavoriteNotes = exports.isInFavorites = exports.getFavorites = exports.removeFromFavorites = exports.addToFavorites = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 2-7: Add influencer to favorites
const addToFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { influencerId } = req.body;
        if (!userId || !influencerId) {
            return res.status(400).json({ error: 'ユーザーIDとインフルエンサーIDが必須です' });
        }
        // Get client ID
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
        }
        // Check if influencer exists
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサーが見つかりません' });
        }
        // Check if already in favorites
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                clientId_influencerId: {
                    clientId: client.id,
                    influencerId,
                },
            },
        });
        if (existingFavorite) {
            return res.status(400).json({ error: 'すでにお気に入りに追加されています' });
        }
        // Add to favorites
        const favorite = await prisma.favorite.create({
            data: {
                clientId: client.id,
                influencerId,
                notes: req.body.notes || null,
            },
            include: {
                influencer: {
                    select: {
                        id: true,
                        displayName: true,
                        categories: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: 'お気に入りに追加しました',
            favorite,
        });
    }
    catch (error) {
        console.error('お気に入り追加エラー:', error);
        res.status(500).json({ error: 'お気に入りの追加に失敗しました' });
    }
};
exports.addToFavorites = addToFavorites;
// Chapter 2-7: Remove influencer from favorites
const removeFromFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { favoriteId } = req.params;
        if (!userId || !favoriteId) {
            return res.status(400).json({ error: 'ユーザーIDとお気に入りIDが必須です' });
        }
        // Get client ID
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
        }
        // Find and delete favorite
        const favorite = await prisma.favorite.findUnique({
            where: { id: favoriteId },
        });
        if (!favorite) {
            return res.status(404).json({ error: 'お気に入りが見つかりません' });
        }
        if (favorite.clientId !== client.id) {
            return res.status(403).json({ error: '権限がありません' });
        }
        await prisma.favorite.delete({
            where: { id: favoriteId },
        });
        res.json({ message: 'お気に入りから削除しました' });
    }
    catch (error) {
        console.error('お気に入り削除エラー:', error);
        res.status(500).json({ error: 'お気に入りの削除に失敗しました' });
    }
};
exports.removeFromFavorites = removeFromFavorites;
// Chapter 2-7: Get client's favorites
const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '認証が必要です' });
        }
        // Get client ID
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
        }
        // Get favorites
        const favorites = await prisma.favorite.findMany({
            where: { clientId: client.id },
            include: {
                influencer: {
                    select: {
                        id: true,
                        displayName: true,
                        bio: true,
                        categories: true,
                        priceMin: true,
                        priceMax: true,
                        workingStatus: true,
                        socialAccounts: {
                            select: {
                                platform: true,
                                username: true,
                                followerCount: true,
                                engagementRate: true,
                            },
                        },
                    },
                },
            },
            orderBy: { savedAt: 'desc' },
        });
        res.json({
            count: favorites.length,
            favorites,
        });
    }
    catch (error) {
        console.error('お気に入り取得エラー:', error);
        res.status(500).json({ error: 'お気に入りの取得に失敗しました' });
    }
};
exports.getFavorites = getFavorites;
// Chapter 2-7: Check if influencer is in favorites
const isInFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { influencerId } = req.params;
        if (!userId || !influencerId) {
            return res.status(400).json({ error: 'ユーザーIDとインフルエンサーIDが必須です' });
        }
        // Get client ID
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
        }
        // Check favorites
        const favorite = await prisma.favorite.findUnique({
            where: {
                clientId_influencerId: {
                    clientId: client.id,
                    influencerId,
                },
            },
        });
        res.json({
            isInFavorites: !!favorite,
            favoriteId: favorite?.id || null,
        });
    }
    catch (error) {
        console.error('お気に入り確認エラー:', error);
        res.status(500).json({ error: 'お気に入りの確認に失敗しました' });
    }
};
exports.isInFavorites = isInFavorites;
// Chapter 2-7: Update favorite notes
const updateFavoriteNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { favoriteId } = req.params;
        const { notes } = req.body;
        if (!userId || !favoriteId) {
            return res.status(400).json({ error: 'ユーザーIDとお気に入りIDが必須です' });
        }
        // Get client ID
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        if (!client) {
            return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
        }
        // Find favorite
        const favorite = await prisma.favorite.findUnique({
            where: { id: favoriteId },
        });
        if (!favorite) {
            return res.status(404).json({ error: 'お気に入りが見つかりません' });
        }
        if (favorite.clientId !== client.id) {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Update notes
        const updated = await prisma.favorite.update({
            where: { id: favoriteId },
            data: { notes },
            include: {
                influencer: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
        });
        res.json({
            message: 'メモを更新しました',
            favorite: updated,
        });
    }
    catch (error) {
        console.error('お気に入りメモ更新エラー:', error);
        res.status(500).json({ error: 'メモの更新に失敗しました' });
    }
};
exports.updateFavoriteNotes = updateFavoriteNotes;
//# sourceMappingURL=favorites.controller.js.map