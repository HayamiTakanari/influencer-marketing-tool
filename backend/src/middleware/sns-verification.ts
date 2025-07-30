import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifySNSConnections = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

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
      // 必要なプラットフォーム
      const requiredPlatforms = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'];
      
      // 連携済みのプラットフォーム
      const connectedPlatforms = user.influencer.socialAccounts
        .filter(account => account.isConnected)
        .map(account => account.platform);

      // 未連携のプラットフォームを確認
      const missingPlatforms = requiredPlatforms.filter(
        platform => !connectedPlatforms.includes(platform as any)
      );

      if (missingPlatforms.length > 0) {
        return res.status(403).json({
          error: 'SNSアカウントの連携が必要です',
          missingPlatforms,
          message: `以下のプラットフォームの連携が必要です: ${missingPlatforms.join(', ')}`,
        });
      }
    }

    next();
  } catch (error) {
    console.error('SNS verification error:', error);
    res.status(500).json({ error: 'SNS連携の確認中にエラーが発生しました' });
  }
};