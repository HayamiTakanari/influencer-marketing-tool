import { PrismaClient, Portfolio, Platform } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ポートフォリオデータ
 * Chapter 1-7: インフルエンサーのポートフォリオ登録
 */
export interface PortfolioData {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  platform?: Platform;
}

/**
 * ポートフォリオアイテムを作成
 */
export const createPortfolioItem = async (
  influencerId: string,
  portfolioData: PortfolioData
): Promise<Portfolio> => {
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
  } catch (error) {
    console.error('Error creating portfolio item:', error);
    throw error;
  }
};

/**
 * ポートフォリオアイテムを更新
 */
export const updatePortfolioItem = async (
  portfolioId: string,
  influencerId: string,
  portfolioData: Partial<PortfolioData>
): Promise<Portfolio> => {
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
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    throw error;
  }
};

/**
 * ポートフォリオアイテムを削除
 */
export const deletePortfolioItem = async (
  portfolioId: string,
  influencerId: string
): Promise<void> => {
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
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    throw error;
  }
};

/**
 * インフルエンサーのすべてのポートフォリオを取得
 */
export const getPortfolioItems = async (
  influencerId: string,
  limit?: number,
  offset?: number
): Promise<{ items: Portfolio[]; total: number }> => {
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
  } catch (error) {
    console.error('Error getting portfolio items:', error);
    throw error;
  }
};

/**
 * 単一のポートフォリオアイテムを取得
 */
export const getPortfolioItem = async (
  portfolioId: string,
  influencerId?: string
): Promise<Portfolio | null> => {
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
  } catch (error) {
    console.error('Error getting portfolio item:', error);
    throw error;
  }
};

/**
 * ポートフォリオのバリデーション
 */
export const validatePortfolioData = (portfolioData: PortfolioData): string[] => {
  const errors: string[] = [];

  // タイトルの検証
  if (!portfolioData.title || portfolioData.title.trim().length === 0) {
    errors.push('ポートフォリオのタイトルを入力してください');
  } else if (portfolioData.title.length > 100) {
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
    } catch (e) {
      errors.push('リンクは有効なURLを入力してください');
    }
  }

  return errors;
};

/**
 * ポートフォリオの統計情報を取得
 */
export const getPortfolioStats = async (influencerId: string) => {
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
  } catch (error) {
    console.error('Error getting portfolio stats:', error);
    throw error;
  }
};
