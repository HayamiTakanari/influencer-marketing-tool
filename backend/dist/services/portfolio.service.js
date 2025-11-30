"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioStats = exports.validatePortfolioData = exports.getPortfolioItem = exports.getPortfolioItems = exports.deletePortfolioItem = exports.updatePortfolioItem = exports.createPortfolioItem = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * ポートフォリオアイテムを作成
 */
const createPortfolioItem = async (influencerId, portfolioData) => {
    try {
        // インフルエンサーの存在確認
        const influencer = await prisma.influencer.findUnique({
            where: { id: influencerId },
        });
        if (!influencer) {
            throw new Error('Influencer not found');
        }
        // ポートフォリオを作成
        const portfolio = await prisma.portfolio.create({
            data: {
                influencerId,
                title: portfolioData.title,
                description: portfolioData.description || null,
                imageUrl: portfolioData.imageUrl || null,
                link: portfolioData.link || null,
                platform: portfolioData.platform || null,
            },
        });
        console.log(`✓ Portfolio item created for influencer: ${influencerId}`);
        return portfolio;
    }
    catch (error) {
        console.error('Error creating portfolio item:', error);
        throw error;
    }
};
exports.createPortfolioItem = createPortfolioItem;
/**
 * ポートフォリオアイテムを更新
 */
const updatePortfolioItem = async (portfolioId, influencerId, portfolioData) => {
    try {
        // ポートフォリオの所有権確認
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
        });
        if (!portfolio || portfolio.influencerId !== influencerId) {
            throw new Error('Portfolio not found or access denied');
        }
        // ポートフォリオを更新
        const updated = await prisma.portfolio.update({
            where: { id: portfolioId },
            data: {
                title: portfolioData.title || portfolio.title,
                description: portfolioData.description !== undefined ? portfolioData.description : portfolio.description,
                imageUrl: portfolioData.imageUrl !== undefined ? portfolioData.imageUrl : portfolio.imageUrl,
                link: portfolioData.link !== undefined ? portfolioData.link : portfolio.link,
                platform: portfolioData.platform !== undefined ? portfolioData.platform : portfolio.platform,
            },
        });
        console.log(`✓ Portfolio item updated: ${portfolioId}`);
        return updated;
    }
    catch (error) {
        console.error('Error updating portfolio item:', error);
        throw error;
    }
};
exports.updatePortfolioItem = updatePortfolioItem;
/**
 * ポートフォリオアイテムを削除
 */
const deletePortfolioItem = async (portfolioId, influencerId) => {
    try {
        // ポートフォリオの所有権確認
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
        });
        if (!portfolio || portfolio.influencerId !== influencerId) {
            throw new Error('Portfolio not found or access denied');
        }
        // ポートフォリオを削除
        await prisma.portfolio.delete({
            where: { id: portfolioId },
        });
        console.log(`✓ Portfolio item deleted: ${portfolioId}`);
    }
    catch (error) {
        console.error('Error deleting portfolio item:', error);
        throw error;
    }
};
exports.deletePortfolioItem = deletePortfolioItem;
/**
 * インフルエンサーのすべてのポートフォリオを取得
 */
const getPortfolioItems = async (influencerId, limit, offset) => {
    try {
        const take = limit || 10;
        const skip = offset || 0;
        const [items, total] = await Promise.all([
            prisma.portfolio.findMany({
                where: { influencerId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            prisma.portfolio.count({
                where: { influencerId },
            }),
        ]);
        return { items, total };
    }
    catch (error) {
        console.error('Error getting portfolio items:', error);
        throw error;
    }
};
exports.getPortfolioItems = getPortfolioItems;
/**
 * 単一のポートフォリオアイテムを取得
 */
const getPortfolioItem = async (portfolioId, influencerId) => {
    try {
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
        });
        if (!portfolio) {
            return null;
        }
        // influencerId が指定されている場合は、所有権を確認
        if (influencerId && portfolio.influencerId !== influencerId) {
            return null;
        }
        return portfolio;
    }
    catch (error) {
        console.error('Error getting portfolio item:', error);
        throw error;
    }
};
exports.getPortfolioItem = getPortfolioItem;
/**
 * ポートフォリオのバリデーション
 */
const validatePortfolioData = (portfolioData) => {
    const errors = [];
    // タイトルの検証
    if (!portfolioData.title || portfolioData.title.trim().length === 0) {
        errors.push('ポートフォリオのタイトルを入力してください');
    }
    else if (portfolioData.title.length > 100) {
        errors.push('タイトルは100文字以内で入力してください');
    }
    // 説明文の検証
    if (portfolioData.description && portfolioData.description.length > 1000) {
        errors.push('説明は1000文字以内で入力してください');
    }
    // リンクの検証（URLの場合）
    if (portfolioData.link) {
        try {
            new URL(portfolioData.link);
        }
        catch (e) {
            errors.push('リンクは有効なURLを入力してください');
        }
    }
    return errors;
};
exports.validatePortfolioData = validatePortfolioData;
/**
 * ポートフォリオの統計情報を取得
 */
const getPortfolioStats = async (influencerId) => {
    try {
        const total = await prisma.portfolio.count({
            where: { influencerId },
        });
        const byPlatform = await prisma.portfolio.groupBy({
            by: ['platform'],
            where: { influencerId },
            _count: {
                platform: true,
            },
        });
        return {
            total,
            byPlatform: byPlatform.map((p) => ({
                platform: p.platform,
                count: p._count.platform,
            })),
        };
    }
    catch (error) {
        console.error('Error getting portfolio stats:', error);
        throw error;
    }
};
exports.getPortfolioStats = getPortfolioStats;
//# sourceMappingURL=portfolio.service.js.map