"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAchievementStats = exports.deleteAchievement = exports.updateAchievement = exports.getAchievementsByInfluencer = exports.getMyAchievements = exports.createAchievement = void 0;
const client_1 = require("@prisma/client");
const achievements_1 = require("../schemas/achievements");
const prisma = new client_1.PrismaClient();
// v3.0 新機能: 実績管理コントローラー
const createAchievement = async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみ実績を登録できます' });
        }
        const validatedData = achievements_1.createAchievementSchema.parse(req.body);
        // インフルエンサー情報を取得
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        const achievement = await prisma.achievement.create({
            data: {
                ...validatedData,
                influencerId: influencer.id,
                metrics: validatedData.metrics || {},
            },
        });
        res.status(201).json({
            message: '実績を登録しました',
            achievement,
        });
    }
    catch (error) {
        console.error('Create achievement error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.createAchievement = createAchievement;
const getMyAchievements = async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみアクセスできます' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        const achievements = await prisma.achievement.findMany({
            where: { influencerId: influencer.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ achievements });
    }
    catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getMyAchievements = getMyAchievements;
const getAchievementsByInfluencer = async (req, res) => {
    try {
        const { influencerId } = req.params;
        const { purpose, platform, limit = 10, offset = 0 } = req.query;
        const where = { influencerId };
        if (purpose) {
            where.purpose = purpose;
        }
        if (platform) {
            where.platform = platform;
        }
        const achievements = await prisma.achievement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        const total = await prisma.achievement.count({ where });
        res.json({
            achievements,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        console.error('Get achievements by influencer error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getAchievementsByInfluencer = getAchievementsByInfluencer;
const updateAchievement = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみ実績を更新できます' });
        }
        const validatedData = achievements_1.updateAchievementSchema.parse(req.body);
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        // 実績の所有者確認
        const existingAchievement = await prisma.achievement.findFirst({
            where: {
                id,
                influencerId: influencer.id,
            },
        });
        if (!existingAchievement) {
            return res.status(404).json({ error: '実績が見つかりません' });
        }
        const achievement = await prisma.achievement.update({
            where: { id },
            data: {
                ...validatedData,
                metrics: validatedData.metrics || existingAchievement.metrics,
            },
        });
        res.json({
            message: '実績を更新しました',
            achievement,
        });
    }
    catch (error) {
        console.error('Update achievement error:', error);
        if (error instanceof Error && 'issues' in error) {
            return res.status(400).json({
                error: 'バリデーションエラー',
                details: error.issues
            });
        }
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.updateAchievement = updateAchievement;
const deleteAchievement = async (req, res) => {
    try {
        const { user } = req;
        const { id } = req.params;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみ実績を削除できます' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        // 実績の所有者確認
        const existingAchievement = await prisma.achievement.findFirst({
            where: {
                id,
                influencerId: influencer.id,
            },
        });
        if (!existingAchievement) {
            return res.status(404).json({ error: '実績が見つかりません' });
        }
        await prisma.achievement.delete({
            where: { id },
        });
        res.json({ message: '実績を削除しました' });
    }
    catch (error) {
        console.error('Delete achievement error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.deleteAchievement = deleteAchievement;
const getAchievementStats = async (req, res) => {
    try {
        const { user } = req;
        if (!user || user.role !== 'INFLUENCER') {
            return res.status(403).json({ error: 'インフルエンサーのみアクセスできます' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId: user.userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
        }
        // 目的別集計
        const statsByPurpose = await prisma.achievement.groupBy({
            by: ['purpose'],
            where: { influencerId: influencer.id },
            _count: { purpose: true },
        });
        // プラットフォーム別集計
        const statsByPlatform = await prisma.achievement.groupBy({
            by: ['platform'],
            where: { influencerId: influencer.id },
            _count: { platform: true },
        });
        // 総計
        const total = await prisma.achievement.count({
            where: { influencerId: influencer.id },
        });
        res.json({
            total,
            byPurpose: statsByPurpose,
            byPlatform: statsByPlatform,
        });
    }
    catch (error) {
        console.error('Get achievement stats error:', error);
        res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
};
exports.getAchievementStats = getAchievementStats;
//# sourceMappingURL=achievement.controller.js.map