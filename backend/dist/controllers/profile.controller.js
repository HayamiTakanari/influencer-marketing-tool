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
exports.getProfileCompletion = exports.completeRegistration = exports.uploadPortfolioImage = exports.deletePortfolio = exports.updatePortfolio = exports.addPortfolio = exports.deleteSocialAccount = exports.updateSocialAccount = exports.addSocialAccount = exports.updateProfile = exports.getMyProfile = void 0;
var client_1 = require("@prisma/client");
var zod_1 = require("zod");
var multer_1 = require("multer");
var cloudinary_1 = require("cloudinary");
var prisma = new client_1.PrismaClient();
var updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    birthDate: zod_1.z.string().optional(),
    phoneNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    prefecture: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    priceMin: zod_1.z.number().min(0).optional(),
    priceMax: zod_1.z.number().min(0).optional(),
});
var socialAccountSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(client_1.Platform),
    username: zod_1.z.string().min(1),
    profileUrl: zod_1.z.string().url(),
});
var portfolioSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    link: zod_1.z.string().url().optional(),
    platform: zod_1.z.nativeEnum(client_1.Platform).optional(),
});
var getMyProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, influencer, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    isVerified: true,
                                },
                            },
                            socialAccounts: true,
                            portfolio: {
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                res.json(influencer);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Get profile error:', error_1);
                res.status(500).json({ error: 'Failed to get profile' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getMyProfile = getMyProfile;
var updateProfile = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, data, influencer, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                data = updateProfileSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.update({
                        where: { userId: userId },
                        data: __assign(__assign({}, data), { birthDate: data.birthDate ? new Date(data.birthDate) : undefined, lastUpdated: new Date() }),
                        include: {
                            socialAccounts: true,
                            portfolio: true,
                        },
                    })];
            case 1:
                influencer = _b.sent();
                res.json(influencer);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Update profile error:', error_2);
                res.status(500).json({ error: 'Failed to update profile' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateProfile = updateProfile;
var addSocialAccount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, data, influencer, socialAccount, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                data = socialAccountSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.socialAccount.create({
                        data: __assign(__assign({}, data), { influencerId: influencer.id }),
                    })];
            case 2:
                socialAccount = _b.sent();
                res.json(socialAccount);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Add social account error:', error_3);
                res.status(500).json({ error: 'Failed to add social account' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.addSocialAccount = addSocialAccount;
var updateSocialAccount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, data, influencer, socialAccount, error_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                data = socialAccountSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.socialAccount.update({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                        data: data,
                    })];
            case 2:
                socialAccount = _b.sent();
                res.json(socialAccount);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                console.error('Update social account error:', error_4);
                res.status(500).json({ error: 'Failed to update social account' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateSocialAccount = updateSocialAccount;
var deleteSocialAccount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, influencer, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.socialAccount.delete({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                _b.sent();
                res.json({ message: 'Social account deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                console.error('Delete social account error:', error_5);
                res.status(500).json({ error: 'Failed to delete social account' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteSocialAccount = deleteSocialAccount;
var addPortfolio = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, data, influencer, portfolio, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                data = portfolioSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.portfolio.create({
                        data: __assign(__assign({}, data), { influencerId: influencer.id }),
                    })];
            case 2:
                portfolio = _b.sent();
                res.json(portfolio);
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                console.error('Add portfolio error:', error_6);
                res.status(500).json({ error: 'Failed to add portfolio' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.addPortfolio = addPortfolio;
var updatePortfolio = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, data, influencer, portfolio, error_7;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                data = portfolioSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.portfolio.update({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                        data: data,
                    })];
            case 2:
                portfolio = _b.sent();
                res.json(portfolio);
                return [3 /*break*/, 4];
            case 3:
                error_7 = _b.sent();
                console.error('Update portfolio error:', error_7);
                res.status(500).json({ error: 'Failed to update portfolio' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updatePortfolio = updatePortfolio;
var deletePortfolio = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userId, influencer, error_8;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                return [4 /*yield*/, prisma.portfolio.delete({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                _b.sent();
                res.json({ message: 'Portfolio deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _b.sent();
                console.error('Delete portfolio error:', error_8);
                res.status(500).json({ error: 'Failed to delete portfolio' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deletePortfolio = deletePortfolio;
var storage = multer_1.default.memoryStorage();
var upload = (0, multer_1.default)({ storage: storage });
exports.uploadPortfolioImage = [
    upload.single('image'),
    function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        var portfolioId, userId, influencer, portfolio, result, updatedPortfolio, error_9;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    portfolioId = req.params.portfolioId;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!req.file) {
                        return [2 /*return*/, res.status(400).json({ error: 'No image file provided' })];
                    }
                    return [4 /*yield*/, prisma.influencer.findUnique({
                            where: { userId: userId },
                        })];
                case 1:
                    influencer = _b.sent();
                    if (!influencer) {
                        return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                    }
                    return [4 /*yield*/, prisma.portfolio.findFirst({
                            where: {
                                id: portfolioId,
                                influencerId: influencer.id,
                            },
                        })];
                case 2:
                    portfolio = _b.sent();
                    if (!portfolio) {
                        return [2 /*return*/, res.status(404).json({ error: 'Portfolio not found' })];
                    }
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var uploadStream = cloudinary_1.v2.uploader.upload_stream({
                                folder: 'portfolio',
                                resource_type: 'image',
                            }, function (error, result) {
                                if (error)
                                    reject(error);
                                else
                                    resolve(result);
                            });
                            uploadStream.end(req.file.buffer);
                        })];
                case 3:
                    result = _b.sent();
                    return [4 /*yield*/, prisma.portfolio.update({
                            where: { id: portfolioId },
                            data: { imageUrl: result.secure_url },
                        })];
                case 4:
                    updatedPortfolio = _b.sent();
                    res.json(updatedPortfolio);
                    return [3 /*break*/, 6];
                case 5:
                    error_9 = _b.sent();
                    console.error('Upload portfolio image error:', error_9);
                    res.status(500).json({ error: 'Failed to upload image' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); },
];
var completeRegistration = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, influencer, updatedInfluencer, error_10;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            socialAccounts: true,
                        },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Profile not found' })];
                }
                // Validate required fields
                if (!influencer.displayName ||
                    !influencer.categories ||
                    influencer.categories.length === 0 ||
                    influencer.socialAccounts.length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Please complete all required fields before registration',
                        })];
                }
                return [4 /*yield*/, prisma.influencer.update({
                        where: { id: influencer.id },
                        data: { isRegistered: true },
                    })];
            case 2:
                updatedInfluencer = _b.sent();
                res.json(updatedInfluencer);
                return [3 /*break*/, 4];
            case 3:
                error_10 = _b.sent();
                console.error('Complete registration error:', error_10);
                res.status(500).json({ error: 'Failed to complete registration' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.completeRegistration = completeRegistration;
var getProfileCompletion = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, influencer, fields, completedFields, missingFields, totalWeight, completedWeight, completionPercentage, error_11;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: userId },
                        include: {
                            user: true,
                            socialAccounts: true,
                            portfolio: true,
                            achievements: true,
                        },
                    })];
            case 1:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'Influencer profile not found' })];
                }
                fields = [
                    { name: '表示名', key: 'displayName', value: influencer.displayName, weight: 5 },
                    { name: '自己紹介', key: 'bio', value: influencer.bio, weight: 10 },
                    { name: '性別', key: 'gender', value: influencer.gender !== 'NOT_SPECIFIED' ? influencer.gender : null, weight: 5 },
                    { name: '生年月日', key: 'birthDate', value: influencer.birthDate, weight: 5 },
                    { name: '電話番号', key: 'phoneNumber', value: influencer.phoneNumber, weight: 5 },
                    { name: '住所', key: 'address', value: influencer.address, weight: 5 },
                    { name: '都道府県', key: 'prefecture', value: influencer.prefecture, weight: 5 },
                    { name: '市区町村', key: 'city', value: influencer.city, weight: 5 },
                    { name: 'カテゴリー', key: 'categories', value: influencer.categories.length > 0 ? influencer.categories : null, weight: 10 },
                    { name: '最低単価', key: 'priceMin', value: influencer.priceMin, weight: 5 },
                    { name: '最高単価', key: 'priceMax', value: influencer.priceMax, weight: 5 },
                    { name: 'SNSアカウント', key: 'socialAccounts', value: influencer.socialAccounts.length > 0 ? influencer.socialAccounts : null, weight: 15 },
                    { name: 'ポートフォリオ', key: 'portfolio', value: influencer.portfolio.length > 0 ? influencer.portfolio : null, weight: 10 },
                ];
                completedFields = fields.filter(function (field) { return field.value !== null && field.value !== undefined && field.value !== ''; });
                missingFields = fields.filter(function (field) { return field.value === null || field.value === undefined || field.value === ''; });
                totalWeight = fields.reduce(function (sum, field) { return sum + field.weight; }, 0);
                completedWeight = completedFields.reduce(function (sum, field) { return sum + field.weight; }, 0);
                completionPercentage = Math.round((completedWeight / totalWeight) * 100);
                res.json({
                    completionPercentage: completionPercentage,
                    completedFields: completedFields.map(function (f) { return ({ name: f.name, key: f.key }); }),
                    missingFields: missingFields.map(function (f) { return ({ name: f.name, key: f.key, weight: f.weight }); }),
                    stats: {
                        totalFields: fields.length,
                        completedCount: completedFields.length,
                        missingCount: missingFields.length,
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _b.sent();
                console.error('Get profile completion error:', error_11);
                res.status(500).json({ error: 'Failed to get profile completion' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getProfileCompletion = getProfileCompletion;
