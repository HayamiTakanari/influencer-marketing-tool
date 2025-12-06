import { Request, Response } from 'express';
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getPortfolioItems,
  getPortfolioItem,
  validatePortfolioData,
  getPortfolioStats,
} from '../services/portfolio.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

/**
 * Chapter 1-7: ポートフォリオアイテムを作成
 */
export const createPortfolio = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, description, imageUrl, link, platform } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // バリデーション
    const errors = validatePortfolioData({ title, description, imageUrl, link, platform });
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const portfolio = await createPortfolioItem(influencer.id, {
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
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
};

/**
 * Chapter 1-7: ポートフォリオアイテムを更新
 */
export const updatePortfolio = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { portfolioId } = req.params;
    const { title, description, imageUrl, link, platform } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    const portfolio = await updatePortfolioItem(portfolioId, influencer.id, {
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
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    console.error('Error updating portfolio:', error);
    return res.status(500).json({ error: 'Failed to update portfolio' });
  }
};

/**
 * Chapter 1-7: ポートフォリオアイテムを削除
 */
export const deletePortfolio = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const { portfolioId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    await deletePortfolioItem(portfolioId, influencer.id);

    return res.status(200).json({
      message: 'Portfolio item deleted successfully',
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    console.error('Error deleting portfolio:', error);
    return res.status(500).json({ error: 'Failed to delete portfolio' });
  }
};

/**
 * Chapter 1-7: インフルエンサーのポートフォリオ一覧を取得
 */
export const getPortfolios = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const { items, total } = await getPortfolioItems(
      influencer.id,
      Number(limit),
      Number(offset)
    );

    res.status(200).json({
      items,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total,
      },
    });
  } catch (error) {
    console.error('Error getting portfolios:', error);
    res.status(500).json({ error: 'Failed to get portfolios' });
  }
};

/**
 * Chapter 1-7: 単一のポートフォリオアイテムを取得
 */
export const getPortfolio = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { portfolioId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    const portfolio = await getPortfolioItem(portfolioId, influencer?.id);

    if (!portfolio) {
      res.status(404).json({ error: 'Portfolio not found' });
      return;
    }

    res.status(200).json({ portfolio });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ error: 'Failed to get portfolio' });
  }
};

/**
 * Chapter 1-7: ポートフォリオ統計を取得
 */
export const getStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const stats = await getPortfolioStats(influencer.id);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get portfolio stats' });
  }
};
