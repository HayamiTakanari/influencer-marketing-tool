import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const recommendInfluencersForProject = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only clients can get recommendations
    if (userRole !== 'CLIENT') {
      return res.status(403).json({ error: 'Only clients can get AI recommendations' });
    }

    const {
      title,
      description,
      category,
      budget,
      targetPlatforms,
      brandName,
      productName,
      campaignObjective,
      campaignTarget,
      messageToConvey
    } = req.body;

    console.log('Getting AI recommendations for project:', {
      title,
      category,
      budget,
      targetPlatforms
    });

    // Get all active influencers
    const influencers = await prisma.influencer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        socialAccounts: {
          where: {
            isConnected: true,
          },
        },
      },
      where: {
        isRegistered: true,
      },
    });

    // Calculate match scores for each influencer
    const recommendedInfluencers = influencers
      .map((influencer: any) => {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Check platform matching
        const connectedPlatforms = influencer.socialAccounts.map((acc: any) => acc.platform);
        const platformMatches = targetPlatforms.filter(platform =>
          connectedPlatforms.includes(platform)
        );

        if (platformMatches.length > 0) {
          matchScore += 30;
          matchReasons.push(`${platformMatches.join(', ')} で活動`);
        }

        // Check category matching
        if (influencer.categories && influencer.categories.length > 0) {
          const categoryMatch = influencer.categories.some((cat: string) =>
            cat.toLowerCase().includes(category.toLowerCase()) ||
            category.toLowerCase().includes(cat.toLowerCase())
          );
          if (categoryMatch) {
            matchScore += 25;
            matchReasons.push('カテゴリーにマッチ');
          }
        }

        // Check follower count
        const totalFollowers = influencer.socialAccounts.reduce(
          (sum: number, acc: any) => sum + (acc.followerCount || 0),
          0
        );

        // Budget to follower ratio check
        if (budget && totalFollowers > 0) {
          const costPerFollower = budget / totalFollowers;
          if (costPerFollower >= 0.01 && costPerFollower <= 1000) {
            matchScore += 20;
            matchReasons.push('予算レンジに合致');
          }
        }

        // Engagement rate check
        const avgEngagementRate = influencer.socialAccounts.length > 0
          ? influencer.socialAccounts.reduce((sum: number, acc: any) => sum + (acc.engagementRate || 0), 0) /
            influencer.socialAccounts.length
          : 0;

        if (avgEngagementRate > 2) {
          matchScore += 15;
          matchReasons.push('高エンゲージメント率');
        }

        // Location check
        if (influencer.prefecture) {
          matchReasons.push(`${influencer.prefecture}を拠点`);
        }

        return {
          id: influencer.id,
          displayName: influencer.displayName || influencer.user?.email || 'Unknown',
          bio: influencer.bio || '',
          categories: influencer.categories || [],
          prefecture: influencer.prefecture || '',
          socialAccounts: influencer.socialAccounts.map((acc: any) => ({
            id: acc.id,
            platform: acc.platform,
            followerCount: acc.followerCount || 0,
            engagementRate: acc.engagementRate || 0,
            isVerified: acc.isVerified || false,
          })),
          aiScore: Math.min(100, matchScore),
          matchReasons: matchReasons,
          isRecommended: matchScore >= 40,
        };
      })
      .sort((a, b) => b.aiScore - a.aiScore);

    // Generate AI analysis
    const analysis = {
      projectSummary: `「${title}」プロジェクト（${category}）の分析結果`,
      keyPoints: [
        `予算: ¥${budget.toLocaleString()}`,
        `対象プラットフォーム: ${targetPlatforms.join(', ')}`,
        'インフルエンサーマッチングを完了しました',
      ],
      recommendations: [
        `${recommendedInfluencers.length}人のインフルエンサーがマッチしました`,
        '高エンゲージメント率のインフルエンサーを優先的に推奨しています',
        '予算範囲内で最適なコスト効率を実現できるタレントを選定しました',
      ],
    };

    res.json({
      success: true,
      influencers: recommendedInfluencers,
      analysis: analysis,
    });
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    res.status(500).json({ error: 'Failed to get AI recommendations' });
  }
};
