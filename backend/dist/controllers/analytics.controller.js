"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComparisonData = exports.getPerformanceMetrics = exports.getOverviewStats = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var date_fns_1 = require("date-fns");
var prisma = new client_1.PrismaClient();
var analyticsQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['week', 'month', '3months', '6months', 'year']).default('month'),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
var getOverviewStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, query, startDate, endDate, stats, influencer, _a, applicationCount, acceptedApplications, completedProjects, totalEarnings, averageRating, socialAccountsStats, monthlyEarnings, projectsByCategory, acceptanceRate, client, _b, projectsCreated, projectsCompleted, totalSpent, applicationsReceived, averageProjectRating, monthlySpending, projectsByCategory, topInfluencers, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 8, , 9]);
                userId = req.user.id;
                userRole = req.user.role;
                query = analyticsQuerySchema.parse(req.query);
                startDate = void 0;
                endDate = new Date();
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
                stats = {};
                if (!(userRole === 'INFLUENCER')) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _c.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                return [4 /*yield*/, Promise.all([
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
                        prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          SELECT \n            DATE_TRUNC('month', t.created_at) as month,\n            SUM(t.amount) as earnings\n          FROM transactions t\n          JOIN projects p ON t.project_id = p.id\n          WHERE p.matched_influencer_id = ", "\n            AND t.status = 'COMPLETED'\n            AND t.created_at >= ", "\n            AND t.created_at <= ", "\n          GROUP BY DATE_TRUNC('month', t.created_at)\n          ORDER BY month\n        "], ["\n          SELECT \n            DATE_TRUNC('month', t.created_at) as month,\n            SUM(t.amount) as earnings\n          FROM transactions t\n          JOIN projects p ON t.project_id = p.id\n          WHERE p.matched_influencer_id = ", "\n            AND t.status = 'COMPLETED'\n            AND t.created_at >= ", "\n            AND t.created_at <= ", "\n          GROUP BY DATE_TRUNC('month', t.created_at)\n          ORDER BY month\n        "])), influencer.id, startDate, endDate),
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
                    ])];
            case 2:
                _a = _c.sent(), applicationCount = _a[0], acceptedApplications = _a[1], completedProjects = _a[2], totalEarnings = _a[3], averageRating = _a[4], socialAccountsStats = _a[5], monthlyEarnings = _a[6], projectsByCategory = _a[7];
                acceptanceRate = applicationCount > 0 ? (acceptedApplications / applicationCount) * 100 : 0;
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
                return [3 /*break*/, 7];
            case 3:
                if (!(userRole === 'CLIENT')) return [3 /*break*/, 6];
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: userId },
                    })];
            case 4:
                client = _c.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'Client profile not found' })];
                }
                return [4 /*yield*/, Promise.all([
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
                        prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n          SELECT \n            DATE_TRUNC('month', t.created_at) as month,\n            SUM(t.amount) as spending\n          FROM transactions t\n          JOIN projects p ON t.project_id = p.id\n          WHERE p.client_id = ", "\n            AND t.status = 'COMPLETED'\n            AND t.created_at >= ", "\n            AND t.created_at <= ", "\n          GROUP BY DATE_TRUNC('month', t.created_at)\n          ORDER BY month\n        "], ["\n          SELECT \n            DATE_TRUNC('month', t.created_at) as month,\n            SUM(t.amount) as spending\n          FROM transactions t\n          JOIN projects p ON t.project_id = p.id\n          WHERE p.client_id = ", "\n            AND t.status = 'COMPLETED'\n            AND t.created_at >= ", "\n            AND t.created_at <= ", "\n          GROUP BY DATE_TRUNC('month', t.created_at)\n          ORDER BY month\n        "])), client.id, startDate, endDate),
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
                    ])];
            case 5:
                _b = _c.sent(), projectsCreated = _b[0], projectsCompleted = _b[1], totalSpent = _b[2], applicationsReceived = _b[3], averageProjectRating = _b[4], monthlySpending = _b[5], projectsByCategory = _b[6], topInfluencers = _b[7];
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
                    topInfluencers: topInfluencers.map(function (project) {
                        var _a;
                        return ({
                            influencer: project.matchedInfluencer,
                            projectTitle: project.title,
                            amount: ((_a = project.transaction) === null || _a === void 0 ? void 0 : _a.amount) || 0,
                            completedAt: project.updatedAt,
                        });
                    }),
                };
                return [3 /*break*/, 7];
            case 6: return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            case 7:
                res.json({
                    period: query.period,
                    startDate: startDate,
                    endDate: endDate,
                    stats: stats,
                });
                return [3 /*break*/, 9];
            case 8:
                error_1 = _c.sent();
                console.error('Get overview stats error:', error_1);
                res.status(500).json({ error: 'Failed to get analytics data' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getOverviewStats = getOverviewStats;
var getPerformanceMetrics = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, influencer, sixMonthsAgo, _a, followerGrowth, engagementTrends, projectPerformance, earnings, totalProjects, completedProjects, completionRate, totalFollowers, averageEngagement, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                userRole = req.user.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can view performance metrics' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            socialAccounts: true,
                        },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                sixMonthsAgo = (0, date_fns_1.subMonths)(new Date(), 6);
                return [4 /*yield*/, Promise.all([
                        // Follower growth (mock data - in real app this would come from SNS APIs)
                        prisma.socialAccount.findMany({
                            where: {
                                influencerId: influencer.id,
                            },
                            select: {
                                platform: true,
                                followerCount: true,
                                engagementRate: true,
                                lastSynced: true,
                            },
                        }),
                        // Engagement trends (mock data)
                        influencer.socialAccounts.map(function (account) { return ({
                            platform: account.platform,
                            engagementRate: account.engagementRate,
                            followerCount: account.followerCount,
                        }); }),
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
                        prisma.$queryRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n        SELECT \n          DATE_TRUNC('month', t.created_at) as month,\n          SUM(t.amount) as amount,\n          COUNT(*) as project_count\n        FROM transactions t\n        JOIN projects p ON t.project_id = p.id\n        WHERE p.matched_influencer_id = ", "\n          AND t.status = 'COMPLETED'\n          AND t.created_at >= ", "\n        GROUP BY DATE_TRUNC('month', t.created_at)\n        ORDER BY month\n      "], ["\n        SELECT \n          DATE_TRUNC('month', t.created_at) as month,\n          SUM(t.amount) as amount,\n          COUNT(*) as project_count\n        FROM transactions t\n        JOIN projects p ON t.project_id = p.id\n        WHERE p.matched_influencer_id = ", "\n          AND t.status = 'COMPLETED'\n          AND t.created_at >= ", "\n        GROUP BY DATE_TRUNC('month', t.created_at)\n        ORDER BY month\n      "])), influencer.id, sixMonthsAgo),
                    ])];
            case 2:
                _a = _b.sent(), followerGrowth = _a[0], engagementTrends = _a[1], projectPerformance = _a[2], earnings = _a[3];
                totalProjects = projectPerformance.length;
                completedProjects = projectPerformance.filter(function (p) { return p.status === 'COMPLETED'; }).length;
                completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
                totalFollowers = followerGrowth.reduce(function (sum, acc) { return sum + acc.followerCount; }, 0);
                averageEngagement = followerGrowth.length > 0
                    ? followerGrowth.reduce(function (sum, acc) { return sum + acc.engagementRate; }, 0) / followerGrowth.length
                    : 0;
                res.json({
                    socialMetrics: {
                        totalFollowers: totalFollowers,
                        averageEngagement: Math.round(averageEngagement * 100) / 100,
                        platforms: followerGrowth,
                        engagementTrends: engagementTrends,
                    },
                    projectMetrics: {
                        totalProjects: totalProjects,
                        completedProjects: completedProjects,
                        completionRate: Math.round(completionRate * 100) / 100,
                        projectsByCategory: projectPerformance.reduce(function (acc, project) {
                            acc[project.category] = (acc[project.category] || 0) + 1;
                            return acc;
                        }, {}),
                    },
                    earnings: earnings,
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error('Get performance metrics error:', error_2);
                res.status(500).json({ error: 'Failed to get performance metrics' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPerformanceMetrics = getPerformanceMetrics;
var getComparisonData = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, influencer, similarInfluencers, industryStats, industryAverages, yourTotalFollowers, yourAvgEngagement, yourProjects, yourTotalEarnings, yourAvgEarningsPerProject, yourStats, comparison, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                userRole = req.user.role;
                if (userRole !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only influencers can view comparison data' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            socialAccounts: true,
                        },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                return [4 /*yield*/, prisma.influencer.findMany({
                        where: {
                            id: { not: influencer.id },
                            categories: { hasSome: influencer.categories },
                            prefecture: influencer.prefecture,
                        },
                        include: {
                            socialAccounts: true,
                            projects: {
                                where: {
                                    status: 'COMPLETED',
                                },
                                include: {
                                    transaction: true,
                                },
                            },
                        },
                        take: 50, // Get a sample for comparison
                    })];
            case 2:
                similarInfluencers = _a.sent();
                if (similarInfluencers.length === 0) {
                    return [2 /*return*/, res.json({
                            message: 'Not enough data for comparison',
                            yourStats: {
                                averageEngagement: influencer.socialAccounts.reduce(function (sum, acc) { return sum + acc.engagementRate; }, 0) / influencer.socialAccounts.length,
                                totalFollowers: influencer.socialAccounts.reduce(function (sum, acc) { return sum + acc.followerCount; }, 0),
                            },
                        })];
                }
                industryStats = similarInfluencers.reduce(function (acc, inf) {
                    var totalFollowers = inf.socialAccounts.reduce(function (sum, acc) { return sum + acc.followerCount; }, 0);
                    var avgEngagement = inf.socialAccounts.length > 0
                        ? inf.socialAccounts.reduce(function (sum, acc) { return sum + acc.engagementRate; }, 0) / inf.socialAccounts.length
                        : 0;
                    var totalEarnings = inf.projects.reduce(function (sum, proj) { var _a; return sum + (((_a = proj.transaction) === null || _a === void 0 ? void 0 : _a.amount) || 0); }, 0);
                    acc.totalFollowers += totalFollowers;
                    acc.totalEngagement += avgEngagement;
                    acc.totalEarnings += totalEarnings;
                    acc.projectCount += inf.projects.length;
                    return acc;
                }, {
                    totalFollowers: 0,
                    totalEngagement: 0,
                    totalEarnings: 0,
                    projectCount: 0,
                });
                industryAverages = {
                    averageFollowers: Math.round(industryStats.totalFollowers / similarInfluencers.length),
                    averageEngagement: Math.round((industryStats.totalEngagement / similarInfluencers.length) * 100) / 100,
                    averageEarningsPerProject: industryStats.projectCount > 0
                        ? Math.round(industryStats.totalEarnings / industryStats.projectCount)
                        : 0,
                };
                yourTotalFollowers = influencer.socialAccounts.reduce(function (sum, acc) { return sum + acc.followerCount; }, 0);
                yourAvgEngagement = influencer.socialAccounts.length > 0
                    ? influencer.socialAccounts.reduce(function (sum, acc) { return sum + acc.engagementRate; }, 0) / influencer.socialAccounts.length
                    : 0;
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            matchedInfluencerId: influencer.id,
                            status: 'COMPLETED',
                        },
                        include: {
                            transaction: true,
                        },
                    })];
            case 3:
                yourProjects = _a.sent();
                yourTotalEarnings = yourProjects.reduce(function (sum, proj) { var _a; return sum + (((_a = proj.transaction) === null || _a === void 0 ? void 0 : _a.amount) || 0); }, 0);
                yourAvgEarningsPerProject = yourProjects.length > 0
                    ? Math.round(yourTotalEarnings / yourProjects.length)
                    : 0;
                yourStats = {
                    totalFollowers: yourTotalFollowers,
                    averageEngagement: Math.round(yourAvgEngagement * 100) / 100,
                    averageEarningsPerProject: yourAvgEarningsPerProject,
                };
                comparison = {
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
                    yourStats: yourStats,
                    industryAverages: industryAverages,
                    comparison: {
                        followersPercentile: Math.round(comparison.followersPercentile),
                        engagementPercentile: Math.round(comparison.engagementPercentile),
                        earningsPercentile: Math.round(comparison.earningsPercentile),
                    },
                    sampleSize: similarInfluencers.length,
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                console.error('Get comparison data error:', error_3);
                res.status(500).json({ error: 'Failed to get comparison data' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getComparisonData = getComparisonData;
var templateObject_1, templateObject_2, templateObject_3;
