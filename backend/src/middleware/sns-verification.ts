import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifySNSConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // ユーザー情報とインフルエンサー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        influencer: {
          include: {
            socialAccounts: true,
          },
        },
      },
    });

    // インフルエンサーのみチェック
    if (user?.role === 'INFLUENCER' && user.influencer) {
      // 連携済みのプラットフォーム
      const connectedPlatforms = user.influencer.socialAccounts
        .filter(account => account.isConnected)
        .map(account => account.platform);

      // 少なくとも1つのSNSアカウントが連携されているかチェック
      if (connectedPlatforms.length === 0) {
        return res.status(403).json({
          error: 'SNSアカウントの連携が必要です',
          message: '案件に応募するには、少なくとも1つのSNSアカウントを連携してください',
        });
      }
    }

    next();
  } catch (error) {
    console.error('SNS verification error:', error);
    res.status(500).json({ error: 'SNS連携の確認中にエラーが発生しました' });
  }
};