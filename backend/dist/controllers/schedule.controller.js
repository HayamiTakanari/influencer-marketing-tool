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
exports.sendMilestoneNotifications = exports.getUpcomingMilestones = exports.updateMilestone = exports.getProjectSchedule = exports.createProjectSchedule = void 0;
var client_1 = require("@prisma/client");
var schedule_1 = require("../schemas/schedule");
// フェーズの色とアイコンのマッピング
var getPhaseColor = function (type) {
    var colorMap = {
        FORMAL_REQUEST: 'bg-blue-500',
        PRODUCT_RECEIPT: 'bg-green-500',
        DRAFT_CREATION: 'bg-purple-500',
        DRAFT_SUBMISSION: 'bg-indigo-500',
        SCRIPT_FEEDBACK: 'bg-yellow-500',
        SCRIPT_REVISION: 'bg-orange-500',
        SCRIPT_FINALIZE: 'bg-red-500',
        SHOOTING_PERIOD: 'bg-pink-500',
        VIDEO_DRAFT_SUBMIT: 'bg-teal-500',
        VIDEO_FEEDBACK: 'bg-cyan-500',
        VIDEO_REVISION: 'bg-emerald-500',
        VIDEO_FINAL_SUBMIT: 'bg-lime-500',
        VIDEO_FINALIZE: 'bg-amber-500',
        POSTING_PERIOD: 'bg-rose-500',
        INSIGHT_SUBMIT: 'bg-violet-500'
    };
    return colorMap[type] || 'bg-gray-500';
};
var getPhaseIcon = function (type) {
    var iconMap = {
        FORMAL_REQUEST: '📄',
        PRODUCT_RECEIPT: '📦',
        DRAFT_CREATION: '✏️',
        DRAFT_SUBMISSION: '📝',
        SCRIPT_FEEDBACK: '💬',
        SCRIPT_REVISION: '🔄',
        SCRIPT_FINALIZE: '✅',
        SHOOTING_PERIOD: '🎥',
        VIDEO_DRAFT_SUBMIT: '🎬',
        VIDEO_FEEDBACK: '📹',
        VIDEO_REVISION: '🎞️',
        VIDEO_FINAL_SUBMIT: '💾',
        VIDEO_FINALIZE: '🎯',
        POSTING_PERIOD: '📱',
        INSIGHT_SUBMIT: '📊'
    };
    return iconMap[type] || '📋';
};
var prisma = new client_1.PrismaClient();
// v3.0 新機能: スケジュール管理コントローラー
var createProjectSchedule = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, validatedData, client, project, existingSchedule, schedule_2, milestones, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                user = req.user;
                if (!user || user.role !== 'CLIENT') {
                    return [2 /*return*/, res.status(403).json({ error: 'クライアントのみスケジュールを作成できます' })];
                }
                validatedData = schedule_1.createProjectScheduleSchema.parse(req.body);
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                client = _a.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'クライアント情報が見つかりません' })];
                }
                return [4 /*yield*/, prisma.project.findFirst({
                        where: {
                            id: validatedData.projectId,
                            clientId: client.id,
                        },
                    })];
            case 2:
                project = _a.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'プロジェクトが見つかりません' })];
                }
                return [4 /*yield*/, prisma.projectSchedule.findUnique({
                        where: { projectId: validatedData.projectId },
                    })];
            case 3:
                existingSchedule = _a.sent();
                if (existingSchedule) {
                    return [2 /*return*/, res.status(409).json({ error: '既にスケジュールが作成されています' })];
                }
                return [4 /*yield*/, prisma.projectSchedule.create({
                        data: {
                            projectId: validatedData.projectId,
                            publishDate: new Date(validatedData.publishDate),
                        },
                    })];
            case 4:
                schedule_2 = _a.sent();
                return [4 /*yield*/, Promise.all(validatedData.milestones.map(function (milestone) {
                        return prisma.milestone.create({
                            data: {
                                scheduleId: schedule_2.id,
                                type: milestone.type,
                                title: milestone.title,
                                description: milestone.description,
                                dueDate: new Date(milestone.dueDate),
                            },
                        });
                    }))];
            case 5:
                milestones = _a.sent();
                res.status(201).json({
                    message: 'スケジュールを作成しました',
                    schedule: __assign(__assign({}, schedule_2), { milestones: milestones }),
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.error('Create project schedule error:', error_1);
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
exports.createProjectSchedule = createProjectSchedule;
var getProjectSchedule = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, projectId, project, hasAccess, schedule, phases, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                user = req.user;
                projectId = req.params.projectId;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: '認証が必要です' })];
                }
                return [4 /*yield*/, prisma.project.findUnique({
                        where: { id: projectId },
                        include: {
                            client: { select: { userId: true } },
                            matchedInfluencer: { select: { userId: true } },
                        },
                    })];
            case 1:
                project = _b.sent();
                if (!project) {
                    return [2 /*return*/, res.status(404).json({ error: 'プロジェクトが見つかりません' })];
                }
                hasAccess = project.client.userId === user.userId ||
                    ((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.userId) === user.userId;
                if (!hasAccess) {
                    return [2 /*return*/, res.status(403).json({ error: 'アクセス権限がありません' })];
                }
                return [4 /*yield*/, prisma.projectSchedule.findUnique({
                        where: { projectId: projectId },
                        include: {
                            milestones: {
                                orderBy: { dueDate: 'asc' },
                            },
                        },
                    })];
            case 2:
                schedule = _b.sent();
                if (!schedule) {
                    return [2 /*return*/, res.status(404).json({ error: 'スケジュールが見つかりません' })];
                }
                phases = schedule.milestones.map(function (milestone) {
                    var _a, _b;
                    return ({
                        id: milestone.id,
                        type: milestone.type,
                        title: milestone.title,
                        description: milestone.description,
                        startDate: (_a = milestone.dueDate) === null || _a === void 0 ? void 0 : _a.toISOString(),
                        endDate: (_b = milestone.dueDate) === null || _b === void 0 ? void 0 : _b.toISOString(),
                        status: milestone.isCompleted ? 'completed' : 'pending',
                        isDateRange: false,
                        color: getPhaseColor(milestone.type),
                        icon: getPhaseIcon(milestone.type),
                    });
                });
                res.json({
                    phases: phases,
                    createdAt: schedule.createdAt.toISOString(),
                    updatedAt: schedule.updatedAt.toISOString()
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error('Get project schedule error:', error_2);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getProjectSchedule = getProjectSchedule;
var updateMilestone = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, validatedData, milestone, hasAccess, updatedMilestone, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                user = req.user;
                id = req.params.id;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: '認証が必要です' })];
                }
                validatedData = schedule_1.updateMilestoneSchemaExport.parse(req.body);
                return [4 /*yield*/, prisma.milestone.findUnique({
                        where: { id: id },
                        include: {
                            schedule: {
                                include: {
                                    project: {
                                        include: {
                                            client: { select: { userId: true } },
                                            matchedInfluencer: { select: { userId: true } },
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                milestone = _b.sent();
                if (!milestone) {
                    return [2 /*return*/, res.status(404).json({ error: 'マイルストーンが見つかりません' })];
                }
                hasAccess = milestone.schedule.project.client.userId === user.userId ||
                    ((_a = milestone.schedule.project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.userId) === user.userId;
                if (!hasAccess) {
                    return [2 /*return*/, res.status(403).json({ error: 'アクセス権限がありません' })];
                }
                return [4 /*yield*/, prisma.milestone.update({
                        where: { id: id },
                        data: __assign(__assign({}, validatedData), { dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined, completedAt: validatedData.isCompleted ? new Date() : null }),
                    })];
            case 2:
                updatedMilestone = _b.sent();
                res.json({
                    message: 'マイルストーンを更新しました',
                    milestone: updatedMilestone,
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Update milestone error:', error_3);
                if (error_3 instanceof Error && 'issues' in error_3) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'バリデーションエラー',
                            details: error_3.issues
                        })];
                }
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateMilestone = updateMilestone;
var getUpcomingMilestones = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, days, daysInt, endDate, projectCondition, client, influencer, milestones, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                user = req.user;
                _a = req.query.days, days = _a === void 0 ? 7 : _a;
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: '認証が必要です' })];
                }
                daysInt = parseInt(days);
                endDate = new Date();
                endDate.setDate(endDate.getDate() + daysInt);
                projectCondition = {};
                if (!(user.role === 'CLIENT')) return [3 /*break*/, 2];
                return [4 /*yield*/, prisma.client.findUnique({
                        where: { userId: user.userId },
                    })];
            case 1:
                client = _b.sent();
                if (!client) {
                    return [2 /*return*/, res.status(404).json({ error: 'クライアント情報が見つかりません' })];
                }
                projectCondition = { clientId: client.id };
                return [3 /*break*/, 4];
            case 2:
                if (!(user.role === 'INFLUENCER')) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma.influencer.findUnique({
                        where: { userId: user.userId },
                    })];
            case 3:
                influencer = _b.sent();
                if (!influencer) {
                    return [2 /*return*/, res.status(404).json({ error: 'インフルエンサー情報が見つかりません' })];
                }
                projectCondition = { matchedInfluencerId: influencer.id };
                _b.label = 4;
            case 4: return [4 /*yield*/, prisma.milestone.findMany({
                    where: {
                        dueDate: {
                            gte: new Date(),
                            lte: endDate,
                        },
                        isCompleted: false,
                        schedule: {
                            project: projectCondition,
                        },
                    },
                    include: {
                        schedule: {
                            include: {
                                project: {
                                    select: {
                                        id: true,
                                        title: true,
                                        client: {
                                            select: {
                                                companyName: true,
                                            },
                                        },
                                        matchedInfluencer: {
                                            select: {
                                                displayName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { dueDate: 'asc' },
                })];
            case 5:
                milestones = _b.sent();
                res.json({ milestones: milestones });
                return [3 /*break*/, 7];
            case 6:
                error_4 = _b.sent();
                console.error('Get upcoming milestones error:', error_4);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.getUpcomingMilestones = getUpcomingMilestones;
var sendMilestoneNotifications = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var tomorrow, endOfTomorrow, milestones, notifications, _i, milestones_1, milestone, project, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                endOfTomorrow = new Date(tomorrow);
                endOfTomorrow.setHours(23, 59, 59, 999);
                return [4 /*yield*/, prisma.milestone.findMany({
                        where: {
                            dueDate: {
                                gte: tomorrow,
                                lte: endOfTomorrow,
                            },
                            isCompleted: false,
                            notificationSent: false,
                        },
                        include: {
                            schedule: {
                                include: {
                                    project: {
                                        include: {
                                            client: { select: { userId: true } },
                                            matchedInfluencer: { select: { userId: true } },
                                        },
                                    },
                                },
                            },
                        },
                    })];
            case 1:
                milestones = _b.sent();
                notifications = [];
                for (_i = 0, milestones_1 = milestones; _i < milestones_1.length; _i++) {
                    milestone = milestones_1[_i];
                    project = milestone.schedule.project;
                    // クライアントに通知
                    if (project.client.userId) {
                        notifications.push(prisma.notification.create({
                            data: {
                                userId: project.client.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u304C\u660E\u65E5\u671F\u9650\u3067\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                },
                            },
                        }));
                    }
                    // インフルエンサーに通知
                    if ((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.userId) {
                        notifications.push(prisma.notification.create({
                            data: {
                                userId: project.matchedInfluencer.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u304C\u660E\u65E5\u671F\u9650\u3067\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                },
                            },
                        }));
                    }
                    // 通知送信フラグを更新
                    notifications.push(prisma.milestone.update({
                        where: { id: milestone.id },
                        data: { notificationSent: true },
                    }));
                }
                return [4 /*yield*/, Promise.all(notifications)];
            case 2:
                _b.sent();
                res.json({
                    message: "".concat(milestones.length, "\u4EF6\u306E\u30DE\u30A4\u30EB\u30B9\u30C8\u30FC\u30F3\u901A\u77E5\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F"),
                    count: milestones.length,
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                console.error('Send milestone notifications error:', error_5);
                res.status(500).json({ error: 'サーバーエラーが発生しました' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.sendMilestoneNotifications = sendMilestoneNotifications;
