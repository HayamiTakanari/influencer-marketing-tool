"use strict";
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
exports.getDashboardData = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var getDashboardData = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, user, projects, activeProjects, achievements, totalFollowers, now, startOfMonth, monthlyEarnings, availableProjects, recentProjects, projects, activeProjects, recentProjects, error_1;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                _k.trys.push([0, 14, , 15]);
                if (!req.user) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return [2 /*return*/];
                }
                userId = req.user.userId;
                userRole = req.user.role;
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { id: userId },
                        include: {
                            influencer: {
                                include: {
                                    socialAccounts: true,
                                    portfolio: true,
                                }
                            },
                            client: true,
                        }
                    })];
            case 1:
                user = _k.sent();
                if (!user) {
                    res.status(404).json({ error: 'User not found' });
                    return [2 /*return*/];
                }
                if (!(userRole === 'INFLUENCER')) return [3 /*break*/, 8];
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            matchedInfluencerId: (_a = user.influencer) === null || _a === void 0 ? void 0 : _a.id
                        }
                    })];
            case 2:
                projects = _k.sent();
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            matchedInfluencerId: (_b = user.influencer) === null || _b === void 0 ? void 0 : _b.id,
                            status: 'IN_PROGRESS'
                        }
                    })];
            case 3:
                activeProjects = _k.sent();
                return [4 /*yield*/, prisma.achievement.count({
                        where: {
                            influencerId: (_c = user.influencer) === null || _c === void 0 ? void 0 : _c.id
                        }
                    })];
            case 4:
                achievements = _k.sent();
                totalFollowers = ((_d = user.influencer) === null || _d === void 0 ? void 0 : _d.socialAccounts.reduce(function (sum, account) { return sum + (account.followerCount || 0); }, 0)) || 0;
                now = new Date();
                startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return [4 /*yield*/, prisma.transaction.aggregate({
                        where: {
                            project: {
                                matchedInfluencerId: (_e = user.influencer) === null || _e === void 0 ? void 0 : _e.id
                            },
                            status: 'completed',
                            createdAt: {
                                gte: startOfMonth
                            }
                        },
                        _sum: {
                            amount: true
                        }
                    })];
            case 5:
                monthlyEarnings = _k.sent();
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            status: 'PENDING',
                            endDate: { gte: now }
                        }
                    })];
            case 6:
                availableProjects = _k.sent();
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            matchedInfluencerId: (_f = user.influencer) === null || _f === void 0 ? void 0 : _f.id
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 5,
                        include: {
                            client: {
                                select: {
                                    companyName: true
                                }
                            }
                        }
                    })];
            case 7:
                recentProjects = _k.sent();
                res.json({
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        profile: user.influencer
                    },
                    stats: {
                        totalProjects: projects,
                        activeProjects: activeProjects,
                        totalAchievements: achievements,
                        totalFollowers: totalFollowers,
                        monthlyRevenue: monthlyEarnings._sum.amount || 0,
                        newOffers: availableProjects
                    },
                    recentActivities: recentProjects.map(function (project) { return ({
                        id: project.id,
                        title: project.title,
                        type: 'project',
                        status: project.status,
                        date: project.createdAt,
                        companyName: project.client.companyName
                    }); }),
                    recentProjects: recentProjects.map(function (project) { return ({
                        id: project.id,
                        title: project.title,
                        status: project.status,
                        budget: project.budget,
                        startDate: project.startDate,
                        endDate: project.endDate,
                        companyName: project.client.companyName
                    }); })
                });
                return [3 /*break*/, 13];
            case 8:
                if (!(userRole === 'CLIENT')) return [3 /*break*/, 12];
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            clientId: (_g = user.client) === null || _g === void 0 ? void 0 : _g.id
                        }
                    })];
            case 9:
                projects = _k.sent();
                return [4 /*yield*/, prisma.project.count({
                        where: {
                            clientId: (_h = user.client) === null || _h === void 0 ? void 0 : _h.id,
                            status: 'IN_PROGRESS'
                        }
                    })];
            case 10:
                activeProjects = _k.sent();
                return [4 /*yield*/, prisma.project.findMany({
                        where: {
                            clientId: (_j = user.client) === null || _j === void 0 ? void 0 : _j.id
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 5,
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            startDate: true,
                            endDate: true,
                            createdAt: true
                        }
                    })];
            case 11:
                recentProjects = _k.sent();
                res.json({
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        profile: user.client
                    },
                    stats: {
                        totalProjects: projects,
                        activeProjects: activeProjects,
                        totalSpending: 0,
                        activeInfluencers: 0
                    },
                    recentActivities: recentProjects.map(function (project) { return ({
                        id: project.id,
                        title: project.title,
                        type: 'project',
                        status: project.status,
                        date: project.createdAt
                    }); })
                });
                return [3 /*break*/, 13];
            case 12:
                res.status(400).json({ error: 'Invalid user role' });
                _k.label = 13;
            case 13: return [3 /*break*/, 15];
            case 14:
                error_1 = _k.sent();
                console.error('Dashboard data fetch error:', error_1);
                res.status(500).json({ error: 'Failed to fetch dashboard data' });
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.getDashboardData = getDashboardData;
