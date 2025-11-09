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
exports.validateServicePricing = exports.deleteServicePricing = exports.updateServicePricing = exports.getServicePricingByInfluencer = exports.getMyServicePricing = exports.bulkCreateServicePricing = exports.createServicePricing = void 0;
var client_1 = require("@prisma/client");
var servicePricing_1 = require("../schemas/servicePricing");
var prisma = new client_1.PrismaClient();
// v3.0 新機能: 料金体系管理コントローラー
var createServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validatedData, influencer, servicePricing, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ料金を設定できます' })];
                }
                validatedData = servicePricing_1.createServicePricingSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.servicePricing.create({
                        data: __assign(__assign({}, validatedData), { influencerId: influencer.id }),
                    })];
            case 2:
                servicePricing = _a.sent();
                res.status(201).json({
                    message: '料金設定を登録しました',
                    servicePricing: servicePricing,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('Create service pricing error:', error_1);
                if (error_1 instanceof Error && 'issues' in error_1) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_1.issues
                        })];
                }
                if (error_1 instanceof Error && error_1.message.includes('Unique constraint')) {
                    return [2 /*return*/, res.status(409).json({ error: 'このサービスタイプの料金は既に設定されています' })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createServicePricing = createServicePricing;
var bulkCreateServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validatedData, influencer_1, servicePricings, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ料金を設定できます' })];
                }
                validatedData = servicePricing_1.bulkServicePricingSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer_1 = _a.sent();
                if (!influencer_1) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                // 既存の料金設定を削除
                return [4 /*yield*/, prisma.servicePricing.deleteMany({
                        where: { influencerId: influencer_1.id },
                    })];
            case 2:
                // 既存の料金設定を削除
                _a.sent();
                return [4 /*yield*/, Promise.all(validatedData.map(function (data) {
                        return prisma.servicePricing.create({
                            data: __assign(__assign({}, data), { influencerId: influencer_1.id }),
                        });
                    }))];
            case 3:
                servicePricings = _a.sent();
                res.status(201).json({
                    message: '料金設定を一括登録しました',
                    servicePricings: servicePricings,
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error('Bulk create service pricing error:', error_2);
                if (error_2 instanceof Error && 'issues' in error_2) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_2.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.bulkCreateServicePricing = bulkCreateServicePricing;
var getMyServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, influencer, servicePricings, error_3;
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
                return [4 /*yield*/, prisma.servicePricing.findMany({
                        where: { influencerId: influencer.id },
                        orderBy: { serviceType: 'asc' },
                    })];
            case 2:
                servicePricings = _a.sent();
                res.json({ servicePricings: servicePricings });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Get service pricing error:', error_3);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getMyServicePricing = getMyServicePricing;
var getServicePricingByInfluencer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var influencerId, _a, serviceType, isActive, where, servicePricings, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                influencerId = req.params.influencerId;
                _a = req.query, serviceType = _a.serviceType, isActive = _a.isActive;
                where = { influencerId: influencerId };
                if (serviceType) {
                    where.serviceType = serviceType;
                }
                if (isActive !== undefined) {
                    where.isActive = isActive === 'true';
                }
                return [4 /*yield*/, prisma.servicePricing.findMany({
                        where: where,
                        orderBy: { serviceType: 'asc' },
                    })];
            case 1:
                servicePricings = _b.sent();
                res.json({ servicePricings: servicePricings });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Get service pricing by influencer error:', error_4);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getServicePricingByInfluencer = getServicePricingByInfluencer;
var updateServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, validatedData, influencer, existingServicePricing, servicePricing, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                id = req.params.id;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ料金を更新できます' })];
                }
                validatedData = servicePricing_1.updateServicePricingSchema.parse(req.body);
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.servicePricing.findFirst({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                existingServicePricing = _a.sent();
                if (!existingServicePricing) {
                    return [2 /*return*/, res.status(404).json({ error: '料金設定が見つかりません' })];
                }
                return [4 /*yield*/, prisma.servicePricing.update({
                        where: { id: id },
                        data: validatedData,
                    })];
            case 3:
                servicePricing = _a.sent();
                res.json({
                    message: '料金設定を更新しました',
                    servicePricing: servicePricing,
                });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                console.error('Update service pricing error:', error_5);
                if (error_5 instanceof Error && 'issues' in error_5) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_5.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateServicePricing = updateServicePricing;
var deleteServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, influencer, existingServicePricing, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                user = req.user;
                id = req.params.id;
                if (!user || user.role !== 'INFLUENCER') {
                    return [2 /*return*/, res.status(403).json({ error: 'インフルエンサーのみ料金を削除できます' })];
                }
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                influencer = _a.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.servicePricing.findFirst({
                        where: {
                            id: id,
                            influencerId: influencer.id,
                        },
                    })];
            case 2:
                existingServicePricing = _a.sent();
                if (!existingServicePricing) {
                    return [2 /*return*/, res.status(404).json({ error: '料金設定が見つかりません' })];
                }
                return [4 /*yield*/, prisma.servicePricing.delete({
                        where: { id: id },
                    })];
            case 3:
                _a.sent();
                res.json({ message: '料金設定を削除しました' });
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('Delete service pricing error:', error_6);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteServicePricing = deleteServicePricing;
var validateServicePricing = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, influencer, servicePricings_1, requiredServices, missingServices, isValid, error_7;
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
                return [4 /*yield*/, prisma.servicePricing.findMany({
                        where: {
                            influencerId: influencer.id,
                            isActive: true,
                        },
                    })];
            case 2:
                servicePricings_1 = _a.sent();
                requiredServices = [
                    'PHOTOGRAPHY',
                    'VIDEO_EDITING',
                    'CONTENT_CREATION',
                    'POSTING'
                ];
                missingServices = requiredServices.filter(function (service) {
                    return !servicePricings_1.some(function (sp) { return sp.serviceType === service; });
                });
                isValid = missingServices.length === 0;
                res.json({
                    isValid: isValid,
                    missingServices: missingServices,
                    currentPricings: servicePricings_1,
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                console.error('Validate service pricing error:', error_7);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.validateServicePricing = validateServicePricing;
