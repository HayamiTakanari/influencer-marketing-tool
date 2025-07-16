"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRatingStats = exports.getReviewableProjects = exports.deleteReview = exports.updateReview = exports.getMyReviews = exports.getReviewsForUser = exports.createReview = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const createReviewSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional().default(true),
});
const updateReviewSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5).optional(),
    comment: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional(),
});
const createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { projectId, rating, comment, isPublic } = createReviewSchema.parse(req.body);
        // Get project details
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: true,
                matchedInfluencer: true,
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Only allow reviews for completed projects
        if (project.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Can only review completed projects' });
        }
        // Determine who is being reviewed
        let revieweeId;
        let influencerId = null;
        let clientId = null;
        if (userRole === 'CLIENT') {
            // Client reviewing influencer
            const client = await prisma.client.findUnique({
                where: { userId },
            });
            if (!client || project.clientId !== client.id) {
                return res.status(403).json({ error: 'You can only review projects you own' });
            }
            if (!project.matchedInfluencer) {
                return res.status(400).json({ error: 'No influencer matched to this project' });
            }
            revieweeId = project.matchedInfluencer.userId;
            influencerId = project.matchedInfluencer.id;
        }
        else if (userRole === 'INFLUENCER') {
            // Influencer reviewing client
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
            });
            if (!influencer || project.matchedInfluencerId !== influencer.id) {
                return res.status(403).json({ error: 'You can only review projects you worked on' });
            }
            revieweeId = project.client.userId;
            clientId = project.client.id;
        }
        else {
            return res.status(403).json({ error: 'Only clients and influencers can create reviews' });
        }
        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
            where: {
                projectId_reviewerId: {
                    projectId,
                    reviewerId: userId,
                },
            },
        });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this project' });
        }
        // Create review
        const review = await prisma.review.create({
            data: {
                projectId,
                reviewerId: userId,
                revieweeId,
                influencerId,
                clientId,
                rating,
                comment,
                isPublic,
            },
            include: {
                reviewer: {
                    select: {
                        email: true,
                    },
                },
                reviewee: {
                    select: {
                        email: true,
                    },
                },
                project: {
                    select: {
                        title: true,
                    },
                },
                influencer: {
                    select: {
                        displayName: true,
                    },
                },
                client: {
                    select: {
                        companyName: true,
                    },
                },
            },
        });
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};
exports.createReview = createReview;
const getReviewsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const query = zod_1.z.object({
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(20),
            rating: zod_1.z.number().min(1).max(5).optional(),
        }).parse(req.query);
        const skip = (query.page - 1) * query.limit;
        const where = {
            revieweeId: userId,
            isPublic: true,
        };
        if (query.rating) {
            where.rating = query.rating;
        }
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    reviewer: {
                        select: {
                            email: true,
                        },
                    },
                    project: {
                        select: {
                            title: true,
                            category: true,
                        },
                    },
                    influencer: {
                        select: {
                            displayName: true,
                        },
                    },
                    client: {
                        select: {
                            companyName: true,
                        },
                    },
                },
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review.count({ where }),
        ]);
        const totalPages = Math.ceil(total / query.limit);
        // Calculate average rating
        const avgRating = await prisma.review.aggregate({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });
        res.json({
            reviews,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
            },
            averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 100) / 100 : 0,
            totalReviews: avgRating._count.rating || 0,
        });
    }
    catch (error) {
        console.error('Get reviews for user error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
};
exports.getReviewsForUser = getReviewsForUser;
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = zod_1.z.object({
            type: zod_1.z.enum(['given', 'received']).default('received'),
            page: zod_1.z.number().default(1),
            limit: zod_1.z.number().default(20),
        }).parse(req.query);
        const skip = (query.page - 1) * query.limit;
        const where = query.type === 'given'
            ? { reviewerId: userId }
            : { revieweeId: userId };
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    reviewer: {
                        select: {
                            email: true,
                        },
                    },
                    reviewee: {
                        select: {
                            email: true,
                        },
                    },
                    project: {
                        select: {
                            title: true,
                            category: true,
                        },
                    },
                    influencer: {
                        select: {
                            displayName: true,
                        },
                    },
                    client: {
                        select: {
                            companyName: true,
                        },
                    },
                },
                skip,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review.count({ where }),
        ]);
        const totalPages = Math.ceil(total / query.limit);
        res.json({
            reviews,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages,
            },
        });
    }
    catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
};
exports.getMyReviews = getMyReviews;
const updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviewId } = req.params;
        const data = updateReviewSchema.parse(req.body);
        // Get existing review
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (existingReview.reviewerId !== userId) {
            return res.status(403).json({ error: 'You can only update your own reviews' });
        }
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data,
            include: {
                reviewer: {
                    select: {
                        email: true,
                    },
                },
                reviewee: {
                    select: {
                        email: true,
                    },
                },
                project: {
                    select: {
                        title: true,
                    },
                },
                influencer: {
                    select: {
                        displayName: true,
                    },
                },
                client: {
                    select: {
                        companyName: true,
                    },
                },
            },
        });
        res.json(updatedReview);
    }
    catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
};
exports.updateReview = updateReview;
const deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { reviewId } = req.params;
        // Get existing review
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!existingReview) {
            return res.status(404).json({ error: 'Review not found' });
        }
        // Only allow the reviewer or admin to delete
        if (existingReview.reviewerId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'You can only delete your own reviews' });
        }
        await prisma.review.delete({
            where: { id: reviewId },
        });
        res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
};
exports.deleteReview = deleteReview;
const getReviewableProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        let projects = [];
        if (userRole === 'CLIENT') {
            const client = await prisma.client.findUnique({
                where: { userId },
            });
            if (!client) {
                return res.status(404).json({ error: 'Client profile not found' });
            }
            projects = await prisma.project.findMany({
                where: {
                    clientId: client.id,
                    status: 'COMPLETED',
                    matchedInfluencerId: { not: null },
                    reviews: {
                        none: {
                            reviewerId: userId,
                        },
                    },
                },
                include: {
                    matchedInfluencer: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        else if (userRole === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
            });
            if (!influencer) {
                return res.status(404).json({ error: 'Influencer profile not found' });
            }
            projects = await prisma.project.findMany({
                where: {
                    matchedInfluencerId: influencer.id,
                    status: 'COMPLETED',
                    reviews: {
                        none: {
                            reviewerId: userId,
                        },
                    },
                },
                include: {
                    client: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }
        else {
            return res.status(403).json({ error: 'Only clients and influencers can access reviewable projects' });
        }
        res.json(projects);
    }
    catch (error) {
        console.error('Get reviewable projects error:', error);
        res.status(500).json({ error: 'Failed to get reviewable projects' });
    }
};
exports.getReviewableProjects = getReviewableProjects;
const getRatingStats = async (req, res) => {
    try {
        const { userId } = req.params;
        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
            by: ['rating'],
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            _count: {
                rating: true,
            },
            orderBy: {
                rating: 'desc',
            },
        });
        // Get average rating and total reviews
        const averageData = await prisma.review.aggregate({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });
        // Get recent reviews
        const recentReviews = await prisma.review.findMany({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            include: {
                project: {
                    select: {
                        title: true,
                        category: true,
                    },
                },
                influencer: {
                    select: {
                        displayName: true,
                    },
                },
                client: {
                    select: {
                        companyName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        res.json({
            averageRating: averageData._avg.rating ? Math.round(averageData._avg.rating * 100) / 100 : 0,
            totalReviews: averageData._count.rating || 0,
            ratingDistribution: ratingDistribution.map(item => ({
                rating: item.rating,
                count: item._count.rating,
            })),
            recentReviews,
        });
    }
    catch (error) {
        console.error('Get rating stats error:', error);
        res.status(500).json({ error: 'Failed to get rating statistics' });
    }
};
exports.getRatingStats = getRatingStats;
