"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrefectures = exports.getCategories = exports.getInfluencerStats = exports.getInfluencerById = exports.searchInfluencers = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const searchInfluencersSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    platforms: zod_1.z.array(zod_1.z.nativeEnum(client_1.Platform)).optional(),
    minFollowers: zod_1.z.number().optional(),
    maxFollowers: zod_1.z.number().optional(),
    minPrice: zod_1.z.number().optional(),
    maxPrice: zod_1.z.number().optional(),
    prefecture: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    minEngagementRate: zod_1.z.number().optional(),
    maxEngagementRate: zod_1.z.number().optional(),
    isVerified: zod_1.z.boolean().optional(),
    page: zod_1.z.number().default(1),
    limit: zod_1.z.number().default(20),
});
const searchInfluencers = async (req, res) => {
    try {
        const query = searchInfluencersSchema.parse(req.query);
        const skip = (query.page - 1) * query.limit;
        const where = {
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
        const platformFilters = {};
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
    }
    catch (error) {
        console.error('Search influencers error:', error);
        res.status(500).json({ error: 'Failed to search influencers' });
    }
};
exports.searchInfluencers = searchInfluencers;
const getInfluencerById = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get influencer error:', error);
        res.status(500).json({ error: 'Failed to get influencer' });
    }
};
exports.getInfluencerById = getInfluencerById;
const getInfluencerStats = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get influencer stats error:', error);
        res.status(500).json({ error: 'Failed to get influencer stats' });
    }
};
exports.getInfluencerStats = getInfluencerStats;
const getCategories = async (req, res) => {
    try {
        const influencers = await prisma.influencer.findMany({
            where: { isRegistered: true },
            select: { categories: true },
        });
        const categoriesSet = new Set();
        influencers.forEach((influencer) => {
            influencer.categories.forEach((category) => categoriesSet.add(category));
        });
        const categories = Array.from(categoriesSet).sort();
        res.json(categories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
};
exports.getCategories = getCategories;
const getPrefectures = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get prefectures error:', error);
        res.status(500).json({ error: 'Failed to get prefectures' });
    }
};
exports.getPrefectures = getPrefectures;
//# sourceMappingURL=influencer.controller.js.map