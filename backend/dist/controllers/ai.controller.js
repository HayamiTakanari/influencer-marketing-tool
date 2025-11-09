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
exports.recommendInfluencersForProject = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var recommendInfluencersForProject = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userRole, _a, title, description, category_1, budget_1, targetPlatforms_1, brandName, productName, campaignObjective, campaignTarget, messageToConvey, influencers, recommendedInfluencers, analysis, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.userId;
                userRole = req.user.role;
                // Only clients can get recommendations
                if (userRole !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only clients can get AI recommendations' })];
                }
                _a = req.body, title = _a.title, description = _a.description, category_1 = _a.category, budget_1 = _a.budget, targetPlatforms_1 = _a.targetPlatforms, brandName = _a.brandName, productName = _a.productName, campaignObjective = _a.campaignObjective, campaignTarget = _a.campaignTarget, messageToConvey = _a.messageToConvey;
                console.log('Getting AI recommendations for project:', {
                    title: title,
                    category: category_1,
                    budget: budget_1,
                    targetPlatforms: targetPlatforms_1
                });
                return [4 /*yield*/, prisma.influencer.findMany({
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
                        take: 20, // Limit to 20 influencers for performance
                    })];
            case 1:
                influencers = _b.sent();
                recommendedInfluencers = influencers
                    .map(function (influencer) {
                    var _a;
                    var matchScore = 0;
                    var matchReasons = [];
                    // Check platform matching
                    var connectedPlatforms = influencer.socialAccounts.map(function (acc) { return acc.platform; });
                    var platformMatches = targetPlatforms_1.filter(function (platform) {
                        return connectedPlatforms.includes(platform);
                    });
                    if (platformMatches.length > 0) {
                        matchScore += 30;
                        matchReasons.push("".concat(platformMatches.join(', '), " \u3067\u6D3B\u52D5"));
                    }
                    // Check category matching
                    if (influencer.categories && influencer.categories.length > 0) {
                        var categoryMatch = influencer.categories.some(function (cat) {
                            return cat.toLowerCase().includes(category_1.toLowerCase()) ||
                                category_1.toLowerCase().includes(cat.toLowerCase());
                        });
                        if (categoryMatch) {
                            matchScore += 25;
                            matchReasons.push('カテゴリーにマッチ');
                        }
                    }
                    // Check follower count
                    var totalFollowers = influencer.socialAccounts.reduce(function (sum, acc) { return sum + (acc.followerCount || 0); }, 0);
                    // Budget to follower ratio check
                    if (budget_1 && totalFollowers > 0) {
                        var costPerFollower = budget_1 / totalFollowers;
                        if (costPerFollower >= 0.01 && costPerFollower <= 1000) {
                            matchScore += 20;
                            matchReasons.push('予算レンジに合致');
                        }
                    }
                    // Engagement rate check
                    var avgEngagementRate = influencer.socialAccounts.length > 0
                        ? influencer.socialAccounts.reduce(function (sum, acc) { return sum + (acc.engagementRate || 0); }, 0) /
                            influencer.socialAccounts.length
                        : 0;
                    if (avgEngagementRate > 2) {
                        matchScore += 15;
                        matchReasons.push('高エンゲージメント率');
                    }
                    // Location check
                    if (influencer.prefecture) {
                        matchReasons.push("".concat(influencer.prefecture, "\u3092\u62E0\u70B9"));
                    }
                    return {
                        id: influencer.id,
                        displayName: influencer.displayName || ((_a = influencer.user) === null || _a === void 0 ? void 0 : _a.email) || 'Unknown',
                        bio: influencer.bio || '',
                        categories: influencer.categories || [],
                        prefecture: influencer.prefecture || '',
                        socialAccounts: influencer.socialAccounts.map(function (acc) { return ({
                            id: acc.id,
                            platform: acc.platform,
                            followerCount: acc.followerCount || 0,
                            engagementRate: acc.engagementRate || 0,
                            isVerified: acc.isVerified || false,
                        }); }),
                        aiScore: Math.min(100, matchScore),
                        matchReasons: matchReasons,
                        isRecommended: matchScore >= 40,
                    };
                })
                    .filter(function (inf) { return inf.aiScore > 0; })
                    .sort(function (a, b) { return b.aiScore - a.aiScore; })
                    .slice(0, 15);
                analysis = {
                    projectSummary: "\u300C".concat(title, "\u300D\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\uFF08").concat(category_1, "\uFF09\u306E\u5206\u6790\u7D50\u679C"),
                    keyPoints: [
                        "\u4E88\u7B97: \u00A5".concat(budget_1.toLocaleString()),
                        "\u5BFE\u8C61\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0: ".concat(targetPlatforms_1.join(', ')),
                        'インフルエンサーマッチングを完了しました',
                    ],
                    recommendations: [
                        "".concat(recommendedInfluencers.length, "\u4EBA\u306E\u30A4\u30F3\u30D5\u30EB\u30A8\u30F3\u30B5\u30FC\u304C\u30DE\u30C3\u30C1\u3057\u307E\u3057\u305F"),
                        '高エンゲージメント率のインフルエンサーを優先的に推奨しています',
                        '予算範囲内で最適なコスト効率を実現できるタレントを選定しました',
                    ],
                };
                res.json({
                    success: true,
                    influencers: recommendedInfluencers,
                    analysis: analysis,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error getting AI recommendations:', error_1);
                res.status(500).json({ error: 'Failed to get AI recommendations' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.recommendInfluencersForProject = recommendInfluencersForProject;
