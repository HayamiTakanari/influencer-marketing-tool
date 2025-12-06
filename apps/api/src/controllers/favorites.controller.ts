import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chapter 2-7: Add influencer to favorites
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { influencerId } = req.body;

    if (!userId || !influencerId) {
      return res.status(400).json({ error: 'ユーザーIDとインフルエンサーIDが必須です' });
    }

    // Get client ID
    const client = await prisma.company.findUnique({
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
        companyId_influencerId: {
          companyId: client.id,
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
        companyId: client.id,
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
  } catch (error) {
    console.error('お気に入り追加エラー:', error);
    res.status(500).json({ error: 'お気に入りの追加に失敗しました' });
  }
};

// Chapter 2-7: Remove influencer from favorites
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { favoriteId } = req.params;

    if (!userId || !favoriteId) {
      return res.status(400).json({ error: 'ユーザーIDとお気に入りIDが必須です' });
    }

    // Get client ID
    const client = await prisma.company.findUnique({
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

    if (favorite.companyId !== client.id) {
      return res.status(403).json({ error: '権限がありません' });
    }

    await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    res.json({ message: 'お気に入りから削除しました' });
  } catch (error) {
    console.error('お気に入り削除エラー:', error);
    res.status(500).json({ error: 'お気に入りの削除に失敗しました' });
  }
};

// Chapter 2-7: Get client's favorites
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // Get client ID
    const client = await prisma.company.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
    }

    // Get favorites
    const favorites = await prisma.favorite.findMany({
      where: { companyId: client.id },
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
  } catch (error) {
    console.error('お気に入り取得エラー:', error);
    res.status(500).json({ error: 'お気に入りの取得に失敗しました' });
  }
};

// Chapter 2-7: Check if influencer is in favorites
export const isInFavorites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { influencerId } = req.params;

    if (!userId || !influencerId) {
      return res.status(400).json({ error: 'ユーザーIDとインフルエンサーIDが必須です' });
    }

    // Get client ID
    const client = await prisma.company.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(403).json({ error: 'クライアント企業のみがこの操作を実行できます' });
    }

    // Check favorites
    const favorite = await prisma.favorite.findUnique({
      where: {
        companyId_influencerId: {
          companyId: client.id,
          influencerId,
        },
      },
    });

    res.json({
      isInFavorites: !!favorite,
      favoriteId: favorite?.id || null,
    });
  } catch (error) {
    console.error('お気に入り確認エラー:', error);
    res.status(500).json({ error: 'お気に入りの確認に失敗しました' });
  }
};

// Chapter 2-7: Update favorite notes
export const updateFavoriteNotes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { favoriteId } = req.params;
    const { notes } = req.body;

    if (!userId || !favoriteId) {
      return res.status(400).json({ error: 'ユーザーIDとお気に入りIDが必須です' });
    }

    // Get client ID
    const client = await prisma.company.findUnique({
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

    if (favorite.companyId !== client.id) {
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
  } catch (error) {
    console.error('お気に入りメモ更新エラー:', error);
    res.status(500).json({ error: 'メモの更新に失敗しました' });
  }
};
