import { Request, Response } from 'express';
import { PrismaClient, Platform, Gender } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const searchInfluencersSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  minEngagementRate: z.number().optional(),
  maxEngagementRate: z.number().optional(),
  isVerified: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const searchInfluencers = async (req: Request, res: Response) => {
  try {
    const query = searchInfluencersSchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: any = {
      isRegistered: true,
    };

    if (query.query) {
      where.OR = [
        { displayName: { contains: query.query, mode: 'insensitive' } },
        { bio: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    if (query.categories && query.categories.length > 0) {
      where.categories = { hasSome: query.categories };
    }

    if (query.prefecture) {
      where.prefecture = query.prefecture;
    }

    if (query.city) {
      where.city = query.city;
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.AND = where.AND || [];
      if (query.minPrice !== undefined) {
        where.AND.push({ priceMin: { gte: query.minPrice } });
      }
      if (query.maxPrice !== undefined) {
        where.AND.push({ priceMax: { lte: query.maxPrice } });
      }
    }

    const platformFilters: any = {};
    if (query.platforms && query.platforms.length > 0) {
      platformFilters.platform = { in: query.platforms };
    }
    if (query.minFollowers !== undefined || query.maxFollowers !== undefined) {
      if (query.minFollowers !== undefined) {
        platformFilters.followerCount = { gte: query.minFollowers };
      }
      if (query.maxFollowers !== undefined) {
        platformFilters.followerCount = {
          ...platformFilters.followerCount,
          lte: query.maxFollowers,
        };
      }
    }
    if (query.minEngagementRate !== undefined || query.maxEngagementRate !== undefined) {
      if (query.minEngagementRate !== undefined) {
        platformFilters.engagementRate = { gte: query.minEngagementRate };
      }
      if (query.maxEngagementRate !== undefined) {
        platformFilters.engagementRate = {
          ...platformFilters.engagementRate,
          lte: query.maxEngagementRate,
        };
      }
    }
    if (query.isVerified !== undefined) {
      platformFilters.isVerified = query.isVerified;
    }

    const [influencers, total] = await Promise.all([
      prisma.influencer.findMany({
        where: Object.keys(platformFilters).length > 0
          ? {
              ...where,
              socialAccounts: {
                some: platformFilters,
              },
            }
          : where,
        include: {
          socialAccounts: true,
          portfolio: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take: query.limit,
        orderBy: { lastUpdated: 'desc' },
      }),
      prisma.influencer.count({
        where: Object.keys(platformFilters).length > 0
          ? {
              ...where,
              socialAccounts: {
                some: platformFilters,
              },
            }
          : where,
      }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    res.json({
      influencers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ error: 'Failed to search influencers' });
  }
};

export const getInfluencerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const influencer = await prisma.influencer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
        socialAccounts: true,
        portfolio: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    res.json(influencer);
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({ error: 'Failed to get influencer' });
  }
};

export const getInfluencerStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [completedProjects, averageRating, totalEarnings] = await Promise.all([
      prisma.project.count({
        where: {
          matchedInfluencerId: id,
          status: 'COMPLETED',
        },
      }),
      // TODO: Implement rating system
      Promise.resolve(0),
      prisma.transaction.aggregate({
        where: {
          project: {
            matchedInfluencerId: id,
          },
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    res.json({
      completedProjects,
      averageRating,
      totalEarnings: totalEarnings._sum.amount || 0,
    });
  } catch (error) {
    console.error('Get influencer stats error:', error);
    res.status(500).json({ error: 'Failed to get influencer stats' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const influencers = await prisma.influencer.findMany({
      where: { isRegistered: true },
      select: { categories: true },
    });

    const categoriesSet = new Set<string>();
    influencers.forEach((influencer) => {
      influencer.categories.forEach((category) => categoriesSet.add(category));
    });

    const categories = Array.from(categoriesSet).sort();

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

export const getPrefectures = async (req: Request, res: Response) => {
  try {
    const prefectures = await prisma.influencer.findMany({
      where: {
        isRegistered: true,
        prefecture: { not: null },
      },
      select: { prefecture: true },
      distinct: ['prefecture'],
    });

    const prefectureList = prefectures
      .map((p) => p.prefecture)
      .filter(Boolean)
      .sort();

    res.json(prefectureList);
  } catch (error) {
    console.error('Get prefectures error:', error);
    res.status(500).json({ error: 'Failed to get prefectures' });
  }
};