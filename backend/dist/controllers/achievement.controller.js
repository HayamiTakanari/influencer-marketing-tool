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
exports.getAchievementStats = exports.deleteAchievement = exports.updateAchievement = exports.getAchievementsByInfluencer = exports.getMyAchievements = exports.createAchievement = void 0;
var client_1 = require("@prisma/client");
var achievements_1 = require("../schemas/achievements");
var prisma = new client_1.PrismaClient();
// v3.0 新機能: 実績管理コントローラー
var createAchievement = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validatedData, influencer, achievement, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ実績を登録できます' })];
                }
                validatedData = achievements_1.createAchievementSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.create({
                        data: __assign(__assign({}, validatedData), { influencerId: influencer.id, metrics: validatedData.metrics || {} }),
                    })];
            case 2:
                achievement = _a.sent();
                res.status(201).json({
                    message: '実績を登録しました',
                    achievement: achievement,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('Create achievement error:', error_1);
                if (error_1 instanceof Error && 'issues' in error_1) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_1.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createAchievement = createAchievement;
var getMyAchievements = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, influencer, achievements, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセスできます' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.findMany({
                        where: { influencerId: influencer.id },
                        orderBy: { createdAt: 'desc' },
                    })];
            case 2:
                achievements = _a.sent();
                res.json({ achievements: achievements });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('Get achievements error:', error_2);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyAchievements = getMyAchievements;
var getAchievementsByInfluencer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var influencerId, _a, purpose, platform, _b, limit, _c, offset, where, achievements, total, error_3;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                influencerId = req.params.influencerId;
                _a = req.query, purpose = _a.purpose, platform = _a.platform, _b = _a.limit, limit = _b === void 0 ? 10 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                where = { influencerId: influencerId };
                if (purpose) {
                    where.purpose = purpose;
                }
                if (platform) {
                    where.platform = platform;
                }
                return [4 /*yield*/, prisma.achievement.findMany({
                        where: where,
                        orderBy: { createdAt: 'desc' },
                        take: parseInt(limit),
                        skip: parseInt(offset),
                    })];
            case 1:
                achievements = _d.sent();
                return [4 /*yield*/, prisma.achievement.count({ where: where })];
            case 2:
                total = _d.sent();
                res.json({
                    achievements: achievements,
                    pagination: {
                        total: total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _d.sent();
                console.error('Get achievements by influencer error:', error_3);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAchievementsByInfluencer = getAchievementsByInfluencer;
var updateAchievement = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, validatedData, influencer, existingAchievement, achievement, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                id = req.params.id;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ実績を更新できます' })];
                }
                validatedData = achievements_1.updateAchievementSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.findFirst({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                existingAchievement = _a.sent();
                if (!existingAchievement) {
                    return [2 /*return*/, res.status(404).json({ error: '実績が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.update({
                        where: { id: id },
                        data: __assign(__assign({}, validatedData), { metrics: validatedData.metrics || existingAchievement.metrics }),
                    })];
            case 3:
                achievement = _a.sent();
                res.json({
                    message: '実績を更新しました',
                    achievement: achievement,
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                console.error('Update achievement error:', error_4);
                if (error_4 instanceof Error && 'issues' in error_4) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_4.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateAchievement = updateAchievement;
var deleteAchievement = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, influencer, existingAchievement, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                id = req.params.id;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ実績を削除できます' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.findFirst({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                existingAchievement = _a.sent();
                if (!existingAchievement) {
                    return [2 /*return*/, res.status(404).json({ error: '実績が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.delete({
                        where: { id: id },
                    })];
            case 3:
                _a.sent();
                res.json({ message: '実績を削除しました' });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                console.error('Delete achievement error:', error_5);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteAchievement = deleteAchievement;
var getAchievementStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, influencer, statsByPurpose, statsByPlatform, total, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                user = req.user;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみアクセスできます' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.achievement.groupBy({
                        by: ['purpose'],
                        where: { influencerId: influencer.id },
                        _count: { purpose: true },
                    })];
            case 2:
                statsByPurpose = _a.sent();
                return [4 /*yield*/, prisma.achievement.groupBy({
                        by: ['platform'],
                        where: { influencerId: influencer.id },
                        _count: { platform: true },
                    })];
            case 3:
                statsByPlatform = _a.sent();
                return [4 /*yield*/, prisma.achievement.count({
                        where: { influencerId: influencer.id },
                    })];
            case 4:
                total = _a.sent();
                res.json({
                    total: total,
                    byPurpose: statsByPurpose,
                    byPlatform: statsByPlatform,
                });
                return [3 /*break*/, 6];
            case 5:
                error_6 = _a.sent();
                console.error('Get achievement stats error:', error_6);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getAchievementStats = getAchievementStats;
