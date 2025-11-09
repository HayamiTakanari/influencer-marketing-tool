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
exports.getInquiryStats = exports.getBulkInquiryById = exports.updateInquiryResponse = exports.getMyInquiryResponses = exports.getMyBulkInquiries = exports.createBulkInquiry = void 0;
var client_1 = require("@prisma/client");
var bulkInquiry_1 = require("../schemas/bulkInquiry");
var prisma = new client_1.PrismaClient();
// v3.0 新機能: 一斉問い合わせコントローラー
var createBulkInquiry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validatedData_1, client_2, influencers, bulkInquiry_2, responses, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                user = req.user;
                if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
                    return [2 /*return*/, res.status(403).json({ error: 'クライアント・企業のみ問い合わせを作成できます' })];
                }
                validatedData_1 = bulkInquiry_1.createBulkInquirySchema.parse(req.body);
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                client_2 = _a.sent();
                if (!client_2) {
                    return [2 /*return*/, res.status(404).json({ error: 'クライアント情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.influencer.findMany({
                        where: {
                            id: { in: validatedData_1.targetInfluencers },
                        },
                    })];
            case 2:
                influencers = _a.sent();
                if (influencers.length !== validatedData_1.targetInfluencers.length) {
                    return [2 /*return*/, res.status(400).json({ error: '一部のインフルエンサーが見つかりません' })];
                }
                return [4 /*yield*/, prisma.bulkInquiry.create({
                        data: {
                            title: validatedData_1.title,
                            description: validatedData_1.description,
                            budget: validatedData_1.budget,
                            deadline: validatedData_1.deadline ? new Date(validatedData_1.deadline) : null,
                            requiredServices: validatedData_1.requiredServices,
                            clientId: client_2.id,
                        },
                    })];
            case 3:
                bulkInquiry_2 = _a.sent();
                return [4 /*yield*/, Promise.all(validatedData_1.targetInfluencers.map(function (influencerId) {
                        return prisma.inquiryResponse.create({
                            data: {
                                inquiryId: bulkInquiry_2.id,
                                influencerId: influencerId,
                                status: 'PENDING',
                            },
                        });
                    }))];
            case 4:
                responses = _a.sent();
                // 通知を送信（各インフルエンサーに）
                return [4 /*yield*/, Promise.all(influencers.map(function (influencer) {
                        return prisma.notification.create({
                            data: {
                                userId: influencer.userId,
                                type: 'APPLICATION_RECEIVED',
                                title: '新しい問い合わせが届きました',
                                message: "".concat(client_2.companyName, "\u304B\u3089\u300C").concat(validatedData_1.title, "\u300D\u306E\u554F\u3044\u5408\u308F\u305B\u304C\u5C4A\u304D\u307E\u3057\u305F"),
                                data: {
                                    inquiryId: bulkInquiry_2.id,
                                    clientId: client_2.id,
                                },
                            },
                        });
                    }))];
            case 5:
                // 通知を送信（各インフルエンサーに）
                _a.sent();
                res.status(201).json({
                    message: '問い合わせを送信しました',
                    inquiry: bulkInquiry_2,
                    responseCount: responses.length,
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.error('Create bulk inquiry error:', error_1);
                if (error_1 instanceof Error && 'issues' in error_1) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_1.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.createBulkInquiry = createBulkInquiry;
var getMyBulkInquiries = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, client, inquiries, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
                    return [2 /*return*/, res.status(403).json({ error: 'クライアント・企業のみアクセスできます' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'クライアント情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.bulkInquiry.findMany({
                        where: { clientId: client.id },
                        include: {
                            responses: {
                                include: {
                                    influencer: {
                                        select: {
                                            id: true,
                                            displayName: true,
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            _count: {
                                select: {
                                    responses: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    })];
            case 2:
                inquiries = _a.sent();
                res.json({ inquiries: inquiries });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('Get bulk inquiries error:', error_2);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyBulkInquiries = getMyBulkInquiries;
var getMyInquiryResponses = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, influencer, responses, error_3;
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
                return [4 /*yield*/, prisma.inquiryResponse.findMany({
                        where: { influencerId: influencer.id },
                        include: {
                            inquiry: {
                                include: {
                                    client: {
                                        select: {
                                            id: true,
                                            companyName: true,
                                            contactName: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    })];
            case 2:
                responses = _a.sent();
                res.json({ responses: responses });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Get inquiry responses error:', error_3);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyInquiryResponses = getMyInquiryResponses;
var updateInquiryResponse = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, validatedData, influencer, existingResponse, response, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                user = req.user;
                id = req.params.id;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ回答できます' })];
                }
                validatedData = bulkInquiry_1.updateInquiryResponseSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.inquiryResponse.findFirst({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                        include: {
                            inquiry: {
                                include: {
                                    client: {
                                        select: {
                                            userId: true,
                                            companyName: true,
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 2:
                existingResponse = _a.sent();
                if (!existingResponse) {
                    return [2 /*return*/, res.status(404).json({ error: '問い合わせが見つかりません' })];
                }
                return [4 /*yield*/, prisma.inquiryResponse.update({
                        where: { id: id },
                        data: __assign(__assign({}, validatedData), { availableFrom: validatedData.availableFrom ? new Date(validatedData.availableFrom) : null, availableTo: validatedData.availableTo ? new Date(validatedData.availableTo) : null }),
                    })];
            case 3:
                response = _a.sent();
                // クライアントに通知
                return [4 /*yield*/, prisma.notification.create({
                        data: {
                            userId: existingResponse.inquiry.client.userId,
                            type: validatedData.status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
                            title: '問い合わせに回答がありました',
                            message: "".concat(influencer.displayName, "\u3055\u3093\u304B\u3089\u300C").concat(existingResponse.inquiry.title, "\u300D\u306E\u554F\u3044\u5408\u308F\u305B\u306B\u56DE\u7B54\u304C\u3042\u308A\u307E\u3057\u305F"),
                            data: {
                                inquiryId: existingResponse.inquiryId,
                                responseId: response.id,
                                influencerId: influencer.id,
                            },
                        },
                    })];
            case 4:
                // クライアントに通知
                _a.sent();
                res.json({
                    message: '回答を更新しました',
                    response: response,
                });
                return [3 /*break*/, 6];
            case 5:
                error_4 = _a.sent();
                console.error('Update inquiry response error:', error_4);
                if (error_4 instanceof Error && 'issues' in error_4) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_4.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.updateInquiryResponse = updateInquiryResponse;
var getBulkInquiryById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, inquiry, client, influencer_1, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                user = req.user;
                id = req.params.id;
                return [4 /*yield*/, prisma.bulkInquiry.findUnique({
                        where: { id: id },
                        include: {
                            client: {
                                select: {
                                    id: true,
                                    companyName: true,
                                    contactName: true,
                                },
                            },
                            responses: {
                                include: {
                                    influencer: {
                                        select: {
                                            id: true,
                                            displayName: true,
                                            user: {
                                                select: {
                                                    email: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                inquiry = _a.sent();
                if (!inquiry) {
                    return [2 /*return*/, res.status(404).json({ error: '問い合わせが見つかりません' })];
                }
                if (!((user === null || user === void 0 ? void 0 : user.role) === 'CLIENT' || (user === null || user === void 0 ? void 0 : user.role) === 'COMPANY')) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 2:
                client = _a.sent();
                if (!client || inquiry.clientId !== client.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'アクセス権限がありません' })];
                }
                return [3 /*break*/, 6];
            case 3:
                if (!((user === null || user === void 0 ? void 0 : user.role) === 'INFLUENCER')) return [3 /*break*/, 5];
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 4:
                influencer_1 = _a.sent();
                if (!influencer_1 || !inquiry.responses.some(function (r) { return r.influencerId === influencer_1.id; })) {
                    return [2 /*return*/, res.status(403).json({ error: 'アクセス権限がありません' })];
                }
                return [3 /*break*/, 6];
            case 5: return [2 /*return*/, res.status(403).json({ error: 'アクセス権限がありません' })];
            case 6:
                res.json({ inquiry: inquiry });
                return [3 /*break*/, 8];
            case 7:
                error_5 = _a.sent();
                console.error('Get bulk inquiry error:', error_5);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getBulkInquiryById = getBulkInquiryById;
var getInquiryStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, client, totalInquiries, responseStats, totalResponses, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                if (!user || (user.role !== 'CLIENT' && user.role !== 'COMPANY')) {
                    return [2 /*return*/, res.status(403).json({ error: 'クライアント・企業のみアクセスできます' })];
                }
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'クライアント情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.bulkInquiry.count({
                        where: { clientId: client.id },
                    })];
            case 2:
                totalInquiries = _a.sent();
                return [4 /*yield*/, prisma.inquiryResponse.groupBy({
                        by: ['status'],
                        where: {
                            inquiry: {
                                clientId: client.id,
                            },
                        },
                        _count: {
                            status: true,
                        },
                    })];
            case 3:
                responseStats = _a.sent();
                totalResponses = responseStats.reduce(function (sum, stat) { return sum + stat._count.status; }, 0);
                res.json({
                    totalInquiries: totalInquiries,
                    totalResponses: totalResponses,
                    responseStats: responseStats,
                });
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('Get inquiry stats error:', error_6);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getInquiryStats = getInquiryStats;
