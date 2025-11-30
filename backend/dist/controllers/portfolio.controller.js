"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.getPortfolio = exports.getPortfolios = exports.deletePortfolio = exports.updatePortfolio = exports.createPortfolio = void 0;
const portfolio_service_1 = require("../services/portfolio.service");
/**
 * Chapter 1-7: ポートフォリオアイテムを作成
 */
const createPortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, imageUrl, link, platform } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // バリデーション
        const errors = (0, portfolio_service_1.validatePortfolioData)({ title, description, imageUrl, link, platform });
        if (errors.length > 0) {
            res.status(400).json({ errors });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const portfolio = await (0, portfolio_service_1.createPortfolioItem)(influencer.id, {
            title,
            description,
            imageUrl,
            link,
            platform,
        });
        res.status(201).json({
            message: 'Portfolio item created successfully',
            portfolio,
        });
    }
    catch (error) {
        console.error('Error creating portfolio:', error);
        res.status(500).json({ error: 'Failed to create portfolio' });
    }
};
exports.createPortfolio = createPortfolio;
/**
 * Chapter 1-7: ポートフォリオアイテムを更新
 */
const updatePortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { portfolioId } = req.params;
        const { title, description, imageUrl, link, platform } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        const portfolio = await (0, portfolio_service_1.updatePortfolioItem)(portfolioId, influencer.id, {
            title,
            description,
            imageUrl,
            link,
            platform,
        });
        return res.status(200).json({
            message: 'Portfolio item updated successfully',
            portfolio,
        });
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Portfolio not found' });
        }
        console.error('Error updating portfolio:', error);
        return res.status(500).json({ error: 'Failed to update portfolio' });
    }
};
exports.updatePortfolio = updatePortfolio;
/**
 * Chapter 1-7: ポートフォリオアイテムを削除
 */
const deletePortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { portfolioId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        await (0, portfolio_service_1.deletePortfolioItem)(portfolioId, influencer.id);
        return res.status(200).json({
            message: 'Portfolio item deleted successfully',
        });
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Portfolio not found' });
        }
        console.error('Error deleting portfolio:', error);
        return res.status(500).json({ error: 'Failed to delete portfolio' });
    }
};
exports.deletePortfolio = deletePortfolio;
/**
 * Chapter 1-7: インフルエンサーのポートフォリオ一覧を取得
 */
const getPortfolios = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 10, offset = 0 } = req.query;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const { items, total } = await (0, portfolio_service_1.getPortfolioItems)(influencer.id, Number(limit), Number(offset));
        res.status(200).json({
            items,
            pagination: {
                limit: Number(limit),
                offset: Number(offset),
                total,
            },
        });
    }
    catch (error) {
        console.error('Error getting portfolios:', error);
        res.status(500).json({ error: 'Failed to get portfolios' });
    }
};
exports.getPortfolios = getPortfolios;
/**
 * Chapter 1-7: 単一のポートフォリオアイテムを取得
 */
const getPortfolio = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { portfolioId } = req.params;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        const portfolio = await (0, portfolio_service_1.getPortfolioItem)(portfolioId, influencer?.id);
        if (!portfolio) {
            res.status(404).json({ error: 'Portfolio not found' });
            return;
        }
        res.status(200).json({ portfolio });
    }
    catch (error) {
        console.error('Error getting portfolio:', error);
        res.status(500).json({ error: 'Failed to get portfolio' });
    }
};
exports.getPortfolio = getPortfolio;
/**
 * Chapter 1-7: ポートフォリオ統計を取得
 */
const getStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
        const prisma = new PrismaClient();
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        if (!influencer) {
            res.status(404).json({ error: 'Influencer profile not found' });
            return;
        }
        const stats = await (0, portfolio_service_1.getPortfolioStats)(influencer.id);
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get portfolio stats' });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=portfolio.controller.js.map