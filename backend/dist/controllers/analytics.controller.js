"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComparisonData = exports.getPerformanceMetrics = exports.getOverviewStats = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
const analyticsQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['week', 'month', '3months', '6months', 'year']).default('month'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
const getOverviewStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const query = analyticsQuerySchema.parse(req.query);
        let startDate;
        let endDate = new Date();
        // Calculate date range based on period
        switch (query.period) {
            case 'week':
                startDate = (0, date_fns_1.startOfWeek)(endDate);
                endDate = (0, date_fns_1.endOfWeek)(endDate);
                break;
            case 'month':
                startDate = (0, date_fns_1.startOfMonth)(endDate);
                endDate = (0, date_fns_1.endOfMonth)(endDate);
                break;
            case '3months':
                startDate = (0, date_fns_1.subMonths)(endDate, 3);
                break;
            case '6months':
                startDate = (0, date_fns_1.subMonths)(endDate, 6);
                break;
            case 'year':
                startDate = (0, date_fns_1.subMonths)(endDate, 12);
                break;
            default:
                startDate = (0, date_fns_1.startOfMonth)(endDate);
                endDate = (0, date_fns_1.endOfMonth)(endDate);
        }
        // Override with custom dates if provided
        if (query.startDate) {
            startDate = new Date(query.startDate);
        }
        if (query.endDate) {
            endDate = new Date(query.endDate);
        }
        let stats = {};
        if (userRole === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
            });
            if (!influencer) {
                return res.status(404).json({ error: 'Influencer profile not found' });
            }
            // Get influencer statistics
            const [applicationCount, acceptedApplications, completedProjects, totalEarnings, averageRating, socialAccountsStats, monthlyEarnings, projectsByCategory,] = await Promise.all([
                // Total applications
                prisma.application.count({
                    where: {
                        influencerId: influencer.id,
                        appliedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Accepted applications
                prisma.application.count({
                    where: {
                        influencerId: influencer.id,
                        isAccepted: true,
                        appliedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Completed projects
                prisma.project.count({
                    where: {
                        matchedInfluencerId: influencer.id,
                        status: 'COMPLETED',
                        updatedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Total earnings
                prisma.transaction.aggregate({
                    where: {
                        project: {
                            matchedInfluencerId: influencer.id,
                        },
                        status: 'COMPLETED',
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                // Average rating
                prisma.review.aggregate({
                    where: {
                        influencerId: influencer.id,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _avg: {
                        rating: true,
                    },
                }),
                // Social accounts stats
                prisma.socialAccount.findMany({
                    where: {
                        influencerId: influencer.id,
                    },
                    select: {
                        platform: true,
                        followerCount: true,
                        engagementRate: true,
                    },
                }),
                // Monthly earnings for chart
                prisma.$queryRaw `
          SELECT 
            DATE_TRUNC('month', t.created_at) as month,
            SUM(t.amount) as earnings
          FROM transactions t
          JOIN projects p ON t.project_id = p.id
          WHERE p.matched_influencer_id = ${influencer.id}
            AND t.status = 'COMPLETED'
            AND t.created_at >= ${startDate}
            AND t.created_at <= ${endDate}
          GROUP BY DATE_TRUNC('month', t.created_at)
          ORDER BY month
        `,
                // Projects by category
                prisma.project.groupBy({
                    by: ['category'],
                    where: {
                        matchedInfluencerId: influencer.id,
                        status: 'COMPLETED',
                        updatedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _count: {
                        id: true,
                    },
                }),
            ]);
            const acceptanceRate = applicationCount > 0 ? (acceptedApplications / applicationCount) * 100 : 0;
            stats = {
                applications: {
                    total: applicationCount,
                    accepted: acceptedApplications,
                    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
                },
                projects: {
                    completed: completedProjects,
                    byCategory: projectsByCategory,
                },
                earnings: {
                    total: totalEarnings._sum.amount || 0,
                    monthly: monthlyEarnings,
                },
                rating: {
                    average: averageRating._avg.rating ? Math.round(averageRating._avg.rating * 100) / 100 : 0,
                },
                socialAccounts: socialAccountsStats,
            };
        }
        else if (userRole === 'CLIENT') {
            const client = await prisma.client.findUnique({
                where: { userId },
            });
            if (!client) {
                return res.status(404).json({ error: 'Client profile not found' });
            }
            // Get client statistics
            const [projectsCreated, projectsCompleted, totalSpent, applicationsReceived, averageProjectRating, monthlySpending, projectsByCategory, topInfluencers,] = await Promise.all([
                // Projects created
                prisma.project.count({
                    where: {
                        clientId: client.id,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Projects completed
                prisma.project.count({
                    where: {
                        clientId: client.id,
                        status: 'COMPLETED',
                        updatedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Total spent
                prisma.transaction.aggregate({
                    where: {
                        project: {
                            clientId: client.id,
                        },
                        status: 'COMPLETED',
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                }),
                // Applications received
                prisma.application.count({
                    where: {
                        clientId: client.id,
                        appliedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),
                // Average project rating
                prisma.review.aggregate({
                    where: {
                        project: {
                            clientId: client.id,
                        },
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _avg: {
                        rating: true,
                    },
                }),
                // Monthly spending for chart
                prisma.$queryRaw `
          SELECT 
            DATE_TRUNC('month', t.created_at) as month,
            SUM(t.amount) as spending
          FROM transactions t
          JOIN projects p ON t.project_id = p.id
          WHERE p.client_id = ${client.id}
            AND t.status = 'COMPLETED'
            AND t.created_at >= ${startDate}
            AND t.created_at <= ${endDate}
          GROUP BY DATE_TRUNC('month', t.created_at)
          ORDER BY month
        `,
                // Projects by category
                prisma.project.groupBy({
                    by: ['category'],
                    where: {
                        clientId: client.id,
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _count: {
                        id: true,
                    },
                }),
                // Top influencers worked with
                prisma.project.findMany({
                    where: {
                        clientId: client.id,
                        status: 'COMPLETED',
                        matchedInfluencerId: { not: null },
                        updatedAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    include: {
                        matchedInfluencer: {
                            include: {
                                socialAccounts: true,
                            },
                        },
                        transaction: true,
                    },
                    take: 10,
                    orderBy: {
                        updatedAt: 'desc',
                    },
                }),
            ]);
            stats = {
                projects: {
                    created: projectsCreated,
                    completed: projectsCompleted,
                    byCategory: projectsByCategory,
                },
                spending: {
                    total: totalSpent._sum.amount || 0,
                    monthly: monthlySpending,
                },
                applications: {
                    received: applicationsReceived,
                },
                rating: {
                    average: averageProjectRating._avg.rating ? Math.round(averageProjectRating._avg.rating * 100) / 100 : 0,
                },
                topInfluencers: topInfluencers.map(project => ({
                    influencer: project.matchedInfluencer,
                    projectTitle: project.title,
                    amount: project.transaction?.amount || 0,
                    completedAt: project.updatedAt,
                })),
            };
        }
        else {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({
            period: query.period,
            startDate,
            endDate,
            stats,
        });
    }
    catch (error) {
        console.error('Get overview stats error:', error);
        res.status(500).json({ error: 'Failed to get analytics data' });
    }
};
exports.getOverviewStats = getOverviewStats;
const getPerformanceMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view performance metrics' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                socialAccounts: true,
            },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        // Get performance metrics for the last 6 months
        const sixMonthsAgo = (0, date_fns_1.subMonths)(new Date(), 6);
        const [followerGrowth, engagementTrends, projectPerformance, earnings,] = await Promise.all([
            // Follower growth (mock data - in real app this would come from SNS APIs)
            prisma.socialAccount.findMany({
                where: {
                    influencerId: influencer.id,
                },
                select: {
                    platform: true,
                    followerCount: true,
                    engagementRate: true,
                    lastSyncAt: true,
                },
            }),
            // Engagement trends (mock data)
            influencer.socialAccounts.map(account => ({
                platform: account.platform,
                engagementRate: account.engagementRate,
                followerCount: account.followerCount,
            })),
            // Project completion rate
            prisma.project.findMany({
                where: {
                    matchedInfluencerId: influencer.id,
                    updatedAt: {
                        gte: sixMonthsAgo,
                    },
                },
                select: {
                    status: true,
                    category: true,
                    budget: true,
                    updatedAt: true,
                },
            }),
            // Monthly earnings
            prisma.$queryRaw `
        SELECT 
          DATE_TRUNC('month', t.created_at) as month,
          SUM(t.amount) as amount,
          COUNT(*) as project_count
        FROM transactions t
        JOIN projects p ON t.project_id = p.id
        WHERE p.matched_influencer_id = ${influencer.id}
          AND t.status = 'COMPLETED'
          AND t.created_at >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', t.created_at)
        ORDER BY month
      `,
        ]);
        // Calculate metrics
        const totalProjects = projectPerformance.length;
        const completedProjects = projectPerformance.filter(p => p.status === 'COMPLETED').length;
        const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        const totalFollowers = followerGrowth.reduce((sum, acc) => sum + acc.followerCount, 0);
        const averageEngagement = followerGrowth.length > 0
            ? followerGrowth.reduce((sum, acc) => sum + acc.engagementRate, 0) / followerGrowth.length
            : 0;
        res.json({
            socialMetrics: {
                totalFollowers,
                averageEngagement: Math.round(averageEngagement * 100) / 100,
                platforms: followerGrowth,
                engagementTrends,
            },
            projectMetrics: {
                totalProjects,
                completedProjects,
                completionRate: Math.round(completionRate * 100) / 100,
                projectsByCategory: projectPerformance.reduce((acc, project) => {
                    acc[project.category] = (acc[project.category] || 0) + 1;
                    return acc;
                }, {}),
            },
            earnings,
        });
    }
    catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ error: 'Failed to get performance metrics' });
    }
};
exports.getPerformanceMetrics = getPerformanceMetrics;
const getComparisonData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'INFLUENCER') {
            return res.status(403).json({ error: 'Only influencers can view comparison data' });
        }
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            include: {
                socialAccounts: true,
            },
        });
        if (!influencer) {
            return res.status(404).json({ error: 'Influencer profile not found' });
        }
        // Get industry averages based on similar influencers
        const similarInfluencers = await prisma.influencer.findMany({
            where: {
                id: { not: influencer.id },
                category: influencer.category,
                prefecture: influencer.prefecture,
            },
            include: {
                socialAccounts: true,
                matchedProjects: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        transaction: true,
                    },
                },
            },
            take: 50, // Get a sample for comparison
        });
        if (similarInfluencers.length === 0) {
            return res.json({
                message: 'Not enough data for comparison',
                yourStats: {
                    averageEngagement: influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / influencer.socialAccounts.length,
                    totalFollowers: influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0),
                },
            });
        }
        // Calculate industry averages
        const industryStats = similarInfluencers.reduce((acc, inf) => {
            const totalFollowers = inf.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
            const avgEngagement = inf.socialAccounts.length > 0
                ? inf.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / inf.socialAccounts.length
                : 0;
            const totalEarnings = inf.matchedProjects.reduce((sum, proj) => sum + (proj.transaction?.amount || 0), 0);
            acc.totalFollowers += totalFollowers;
            acc.totalEngagement += avgEngagement;
            acc.totalEarnings += totalEarnings;
            acc.projectCount += inf.matchedProjects.length;
            return acc;
        }, {
            totalFollowers: 0,
            totalEngagement: 0,
            totalEarnings: 0,
            projectCount: 0,
        });
        const industryAverages = {
            averageFollowers: Math.round(industryStats.totalFollowers / similarInfluencers.length),
            averageEngagement: Math.round((industryStats.totalEngagement / similarInfluencers.length) * 100) / 100,
            averageEarningsPerProject: industryStats.projectCount > 0
                ? Math.round(industryStats.totalEarnings / industryStats.projectCount)
                : 0,
        };
        // Calculate your stats
        const yourTotalFollowers = influencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0);
        const yourAvgEngagement = influencer.socialAccounts.length > 0
            ? influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / influencer.socialAccounts.length
            : 0;
        const yourProjects = await prisma.project.findMany({
            where: {
                matchedInfluencerId: influencer.id,
                status: 'COMPLETED',
            },
            include: {
                transaction: true,
            },
        });
        const yourTotalEarnings = yourProjects.reduce((sum, proj) => sum + (proj.transaction?.amount || 0), 0);
        const yourAvgEarningsPerProject = yourProjects.length > 0
            ? Math.round(yourTotalEarnings / yourProjects.length)
            : 0;
        const yourStats = {
            totalFollowers: yourTotalFollowers,
            averageEngagement: Math.round(yourAvgEngagement * 100) / 100,
            averageEarningsPerProject: yourAvgEarningsPerProject,
        };
        // Calculate percentiles
        const comparison = {
            followersPercentile: yourTotalFollowers > industryAverages.averageFollowers ?
                Math.min(75 + (yourTotalFollowers - industryAverages.averageFollowers) / industryAverages.averageFollowers * 25, 95) :
                Math.max(25 - (industryAverages.averageFollowers - yourTotalFollowers) / industryAverages.averageFollowers * 25, 5),
            engagementPercentile: yourAvgEngagement > industryAverages.averageEngagement ?
                Math.min(75 + (yourAvgEngagement - industryAverages.averageEngagement) / industryAverages.averageEngagement * 25, 95) :
                Math.max(25 - (industryAverages.averageEngagement - yourAvgEngagement) / industryAverages.averageEngagement * 25, 5),
            earningsPercentile: yourAvgEarningsPerProject > industryAverages.averageEarningsPerProject ?
                Math.min(75 + (yourAvgEarningsPerProject - industryAverages.averageEarningsPerProject) / industryAverages.averageEarningsPerProject * 25, 95) :
                Math.max(25 - (industryAverages.averageEarningsPerProject - yourAvgEarningsPerProject) / industryAverages.averageEarningsPerProject * 25, 5),
        };
        res.json({
            yourStats,
            industryAverages,
            comparison: {
                followersPercentile: Math.round(comparison.followersPercentile),
                engagementPercentile: Math.round(comparison.engagementPercentile),
                earningsPercentile: Math.round(comparison.earningsPercentile),
            },
            sampleSize: similarInfluencers.length,
        });
    }
    catch (error) {
        console.error('Get comparison data error:', error);
        res.status(500).json({ error: 'Failed to get comparison data' });
    }
};
exports.getComparisonData = getComparisonData;
