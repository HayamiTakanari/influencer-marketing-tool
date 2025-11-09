"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.getPrefectures = exports.getCategories = exports.getInfluencerStats = exports.getInfluencerById = exports.searchInfluencers = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var prisma = new client_1.PrismaClient();
var searchInfluencersSchema = zod_1.z.object({
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
var searchInfluencers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, skip, where, platformFilters, _a, influencers, total, totalPages, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                query = searchInfluencersSchema.parse(req.query);
                skip = (query.page - 1) * query.limit;
                where = {
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
                platformFilters = {};
                if (query.platforms && query.platforms.length > 0) {
                    platformFilters.platform = { in: query.platforms };
                }
                if (query.minFollowers !== undefined || query.maxFollowers !== undefined) {
                    if (query.minFollowers !== undefined) {
                        platformFilters.followerCount = { gte: query.minFollowers };
                    }
                    if (query.maxFollowers !== undefined) {
                        platformFilters.followerCount = __assign(__assign({}, platformFilters.followerCount), { lte: query.maxFollowers });
                    }
                }
                if (query.minEngagementRate !== undefined || query.maxEngagementRate !== undefined) {
                    if (query.minEngagementRate !== undefined) {
                        platformFilters.engagementRate = { gte: query.minEngagementRate };
                    }
                    if (query.maxEngagementRate !== undefined) {
                        platformFilters.engagementRate = __assign(__assign({}, platformFilters.engagementRate), { lte: query.maxEngagementRate });
                    }
                }
                if (query.isVerified !== undefined) {
                    platformFilters.isVerified = query.isVerified;
                }
                return [4 /*yield*/, Promise.all([
                        prisma.influencer.findMany({
                            where: Object.keys(platformFilters).length > 0
                                ? __assign(__assign({}, where), { socialAccounts: {
                                        some: platformFilters,
                                    } }) : where,
                            include: {
                                socialAccounts: true,
                                portfolio: {
                                    take: 3,
                                    orderBy: { createdAt: 'desc' },
                                },
                            },
                            skip: skip,
                            take: query.limit,
                            orderBy: { lastUpdated: 'desc' },
                        }),
                        prisma.influencer.count({
                            where: Object.keys(platformFilters).length > 0
                                ? __assign(__assign({}, where), { socialAccounts: {
                                        some: platformFilters,
                                    } }) : where,
                        }),
                    ])];
            case 1:
                _a = _b.sent(), influencers = _a[0], total = _a[1];
                totalPages = Math.ceil(total / query.limit);
                res.json({
                    influencers: influencers,
                    pagination: {
                        page: query.page,
                        limit: query.limit,
                        total: total,
                        totalPages: totalPages,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Search influencers error:', error_1);
                res.status(500).json({ error: 'Failed to search influencers' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.searchInfluencers = searchInfluencers;
var getInfluencerById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, influencer, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { id: id },
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
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer not found' })];
                }
                res.json(influencer);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Get influencer error:', error_2);
                res.status(500).json({ error: 'Failed to get influencer' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getInfluencerById = getInfluencerById;
var getInfluencerStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, completedProjects, averageRating, totalEarnings, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, Promise.all([
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
                    ])];
            case 1:
                _a = _b.sent(), completedProjects = _a[0], averageRating = _a[1], totalEarnings = _a[2];
                res.json({
                    completedProjects: completedProjects,
                    averageRating: averageRating,
                    totalEarnings: totalEarnings._sum.amount || 0,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Get influencer stats error:', error_3);
                res.status(500).json({ error: 'Failed to get influencer stats' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getInfluencerStats = getInfluencerStats;
var getCategories = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var influencers, categoriesSet_1, categories, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.influencer.findMany({
                        where: { isRegistered: true },
                        select: { categories: true },
                    })];
            case 1:
                influencers = _a.sent();
                categoriesSet_1 = new Set();
                influencers.forEach(function (influencer) {
                    influencer.categories.forEach(function (category) { return categoriesSet_1.add(category); });
                });
                categories = Array.from(categoriesSet_1).sort();
                res.json(categories);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Get categories error:', error_4);
                res.status(500).json({ error: 'Failed to get categories' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getCategories = getCategories;
var getPrefectures = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var prefectures, prefectureList, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.influencer.findMany({
                        where: {
                            isRegistered: true,
                            prefecture: { not: null },
                        },
                        select: { prefecture: true },
                        distinct: ['prefecture'],
                    })];
            case 1:
                prefectures = _a.sent();
                prefectureList = prefectures
                    .map(function (p) { return p.prefecture; })
                    .filter(Boolean)
                    .sort();
                res.json(prefectureList);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Get prefectures error:', error_5);
                res.status(500).json({ error: 'Failed to get prefectures' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPrefectures = getPrefectures;
