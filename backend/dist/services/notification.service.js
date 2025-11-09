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
exports.NotificationService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var NotificationService = /** @class */ (function () {
    function NotificationService() {
    }
    NotificationService.createNotification = function (notificationData) {
        return __awaiter(this, void 0, void 0, function () {
            var notification, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.create({
                                data: {
                                    userId: notificationData.userId,
                                    type: notificationData.type,
                                    title: notificationData.title,
                                    message: notificationData.message,
                                    data: notificationData.data || null,
                                },
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                            role: true,
                                        },
                                    },
                                },
                            })];
                    case 1:
                        notification = _a.sent();
                        // TODO: ここでリアルタイム通知やメール送信を実装
                        // Example: WebSocket通知、プッシュ通知、メール送信など
                        return [2 /*return*/, notification];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to create notification:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.createApplicationReceivedNotification = function (clientUserId, projectTitle, influencerName, applicationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: clientUserId,
                        type: 'APPLICATION_RECEIVED',
                        title: '新しい応募が届きました',
                        message: "".concat(influencerName, "\u3055\u3093\u304C\u300C").concat(projectTitle, "\u300D\u306B\u5FDC\u52DF\u3057\u307E\u3057\u305F\u3002"),
                        data: {
                            applicationId: applicationId,
                            projectTitle: projectTitle,
                            influencerName: influencerName,
                        },
                    })];
            });
        });
    };
    NotificationService.createApplicationAcceptedNotification = function (influencerUserId, projectTitle, companyName, projectId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: influencerUserId,
                        type: 'APPLICATION_ACCEPTED',
                        title: '応募が承認されました！',
                        message: "".concat(companyName, "\u304C\u300C").concat(projectTitle, "\u300D\u3078\u306E\u5FDC\u52DF\u3092\u627F\u8A8D\u3057\u307E\u3057\u305F\u3002"),
                        data: {
                            projectId: projectId,
                            projectTitle: projectTitle,
                            companyName: companyName,
                        },
                    })];
            });
        });
    };
    NotificationService.createApplicationRejectedNotification = function (influencerUserId, projectTitle, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: influencerUserId,
                        type: 'APPLICATION_REJECTED',
                        title: '応募結果のお知らせ',
                        message: "".concat(companyName, "\u306E\u300C").concat(projectTitle, "\u300D\u3078\u306E\u5FDC\u52DF\u304C\u898B\u9001\u308A\u3068\u306A\u308A\u307E\u3057\u305F\u3002"),
                        data: {
                            projectTitle: projectTitle,
                            companyName: companyName,
                        },
                    })];
            });
        });
    };
    NotificationService.createProjectMatchedNotification = function (influencerUserId, projectTitle, companyName, projectId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: influencerUserId,
                        type: 'PROJECT_MATCHED',
                        title: 'プロジェクトマッチング完了',
                        message: "".concat(companyName, "\u306E\u300C").concat(projectTitle, "\u300D\u3068\u30DE\u30C3\u30C1\u30F3\u30B0\u3057\u307E\u3057\u305F\u3002\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u958B\u59CB\u3057\u307E\u3057\u3087\u3046\uFF01"),
                        data: {
                            projectId: projectId,
                            projectTitle: projectTitle,
                            companyName: companyName,
                        },
                    })];
            });
        });
    };
    NotificationService.createMessageReceivedNotification = function (receiverUserId, senderName, projectTitle, projectId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: receiverUserId,
                        type: 'MESSAGE_RECEIVED',
                        title: '新しいメッセージ',
                        message: "".concat(senderName, "\u3055\u3093\u304B\u3089\u300C").concat(projectTitle, "\u300D\u306B\u3064\u3044\u3066\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u5C4A\u304D\u307E\u3057\u305F\u3002"),
                        data: {
                            projectId: projectId,
                            projectTitle: projectTitle,
                            senderName: senderName,
                        },
                    })];
            });
        });
    };
    NotificationService.createPaymentCompletedNotification = function (userId, amount, projectTitle, projectId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: userId,
                        type: 'PAYMENT_COMPLETED',
                        title: '支払いが完了しました',
                        message: "\u300C".concat(projectTitle, "\u300D\u306E\u652F\u6255\u3044\uFF08\u00A5").concat(amount.toLocaleString(), "\uFF09\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F\u3002"),
                        data: {
                            projectId: projectId,
                            projectTitle: projectTitle,
                            amount: amount,
                        },
                    })];
            });
        });
    };
    NotificationService.createProjectStatusChangedNotification = function (userId, projectTitle, oldStatus, newStatus, projectId) {
        return __awaiter(this, void 0, void 0, function () {
            var statusLabels, newStatusLabel;
            return __generator(this, function (_a) {
                statusLabels = {
                    PENDING: '募集中',
                    MATCHED: 'マッチング済み',
                    IN_PROGRESS: '進行中',
                    COMPLETED: '完了',
                    CANCELLED: 'キャンセル',
                };
                newStatusLabel = statusLabels[newStatus] || newStatus;
                return [2 /*return*/, this.createNotification({
                        userId: userId,
                        type: 'PROJECT_STATUS_CHANGED',
                        title: 'プロジェクトステータス変更',
                        message: "\u300C".concat(projectTitle, "\u300D\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u300C").concat(newStatusLabel, "\u300D\u306B\u5909\u66F4\u3055\u308C\u307E\u3057\u305F\u3002"),
                        data: {
                            projectId: projectId,
                            projectTitle: projectTitle,
                            oldStatus: oldStatus,
                            newStatus: newStatus,
                        },
                    })];
            });
        });
    };
    NotificationService.createTeamInvitationNotification = function (userId, teamName, inviterName, teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createNotification({
                        userId: userId,
                        type: 'TEAM_INVITATION',
                        title: 'チームに招待されました',
                        message: "".concat(inviterName, "\u3055\u3093\u304C\u300C").concat(teamName, "\u300D\u30C1\u30FC\u30E0\u306B\u62DB\u5F85\u3057\u307E\u3057\u305F\u3002"),
                        data: {
                            teamId: teamId,
                            teamName: teamName,
                            inviterName: inviterName,
                        },
                    })];
            });
        });
    };
    NotificationService.createSystemAnnouncementNotification = function (userIds, title, message, data) {
        return __awaiter(this, void 0, void 0, function () {
            var notifications;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(userIds.map(function (userId) {
                            return _this.createNotification({
                                userId: userId,
                                type: 'SYSTEM_ANNOUNCEMENT',
                                title: title,
                                message: message,
                                data: data,
                            });
                        }))];
                    case 1:
                        notifications = _a.sent();
                        return [2 /*return*/, notifications];
                }
            });
        });
    };
    NotificationService.getUserNotifications = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, page, limit, unreadOnly) {
            var skip, where, _a, notifications, total;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            if (unreadOnly === void 0) { unreadOnly = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        skip = (page - 1) * limit;
                        where = { userId: userId };
                        if (unreadOnly) {
                            where.isRead = false;
                        }
                        return [4 /*yield*/, Promise.all([
                                prisma.notification.findMany({
                                    where: where,
                                    orderBy: { createdAt: 'desc' },
                                    skip: skip,
                                    take: limit,
                                }),
                                prisma.notification.count({ where: where }),
                            ])];
                    case 1:
                        _a = _b.sent(), notifications = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                notifications: notifications,
                                pagination: {
                                    page: page,
                                    limit: limit,
                                    total: total,
                                    totalPages: Math.ceil(total / limit),
                                },
                            }];
                }
            });
        });
    };
    NotificationService.markAsRead = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.notification.updateMany({
                        where: {
                            id: notificationId,
                            userId: userId,
                            isRead: false,
                        },
                        data: {
                            isRead: true,
                            readAt: new Date(),
                        },
                    })];
            });
        });
    };
    NotificationService.markAllAsRead = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.notification.updateMany({
                        where: {
                            userId: userId,
                            isRead: false,
                        },
                        data: {
                            isRead: true,
                            readAt: new Date(),
                        },
                    })];
            });
        });
    };
    NotificationService.getUnreadCount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.notification.count({
                        where: {
                            userId: userId,
                            isRead: false,
                        },
                    })];
            });
        });
    };
    NotificationService.deleteNotification = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.notification.deleteMany({
                        where: {
                            id: notificationId,
                            userId: userId,
                        },
                    })];
            });
        });
    };
    NotificationService.deleteOldNotifications = function () {
        return __awaiter(this, arguments, void 0, function (daysOld) {
            var cutoffDate;
            if (daysOld === void 0) { daysOld = 30; }
            return __generator(this, function (_a) {
                cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysOld);
                return [2 /*return*/, prisma.notification.deleteMany({
                        where: {
                            createdAt: {
                                lt: cutoffDate,
                            },
                            isRead: true,
                        },
                    })];
            });
        });
    };
    // v3.0 新機能: マイルストーン前日通知
    NotificationService.sendMilestoneReminders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tomorrow, endOfTomorrow, milestones, _i, milestones_1, milestone, project, error_2, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 12, , 13]);
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
                        console.log("Found ".concat(milestones.length, " milestones due tomorrow"));
                        _i = 0, milestones_1 = milestones;
                        _b.label = 2;
                    case 2:
                        if (!(_i < milestones_1.length)) return [3 /*break*/, 11];
                        milestone = milestones_1[_i];
                        project = milestone.schedule.project;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 9, , 10]);
                        if (!project.client.userId) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createNotification({
                                userId: project.client.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u304C\u660E\u65E5\u671F\u9650\u3067\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                    type: 'milestone_reminder',
                                },
                            })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.userId)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.createNotification({
                                userId: project.matchedInfluencer.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u304C\u660E\u65E5\u671F\u9650\u3067\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                    type: 'milestone_reminder',
                                },
                            })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: 
                    // 通知送信フラグを更新
                    return [4 /*yield*/, prisma.milestone.update({
                            where: { id: milestone.id },
                            data: { notificationSent: true },
                        })];
                    case 8:
                        // 通知送信フラグを更新
                        _b.sent();
                        console.log("Sent reminder for milestone ".concat(milestone.id, ": ").concat(milestone.title));
                        return [3 /*break*/, 10];
                    case 9:
                        error_2 = _b.sent();
                        console.error("Failed to send reminder for milestone ".concat(milestone.id, ":"), error_2);
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11:
                        console.log("Milestone reminders sent: ".concat(milestones.length));
                        return [3 /*break*/, 13];
                    case 12:
                        error_3 = _b.sent();
                        console.error('Error sending milestone reminders:', error_3);
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // v3.0 新機能: 期限切れマイルストーンの確認
    NotificationService.checkOverdueMilestones = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, overdueMilestones, _i, overdueMilestones_1, milestone, project, error_4, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 11, , 12]);
                        now = new Date();
                        return [4 /*yield*/, prisma.milestone.findMany({
                                where: {
                                    dueDate: {
                                        lt: now,
                                    },
                                    isCompleted: false,
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
                        overdueMilestones = _b.sent();
                        console.log("Found ".concat(overdueMilestones.length, " overdue milestones"));
                        _i = 0, overdueMilestones_1 = overdueMilestones;
                        _b.label = 2;
                    case 2:
                        if (!(_i < overdueMilestones_1.length)) return [3 /*break*/, 10];
                        milestone = overdueMilestones_1[_i];
                        project = milestone.schedule.project;
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        if (!project.client.userId) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createNotification({
                                userId: project.client.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限超過のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u306E\u671F\u9650\u304C\u904E\u304E\u3066\u3044\u307E\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                    type: 'milestone_overdue',
                                },
                            })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!((_a = project.matchedInfluencer) === null || _a === void 0 ? void 0 : _a.userId)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.createNotification({
                                userId: project.matchedInfluencer.userId,
                                type: 'PROJECT_STATUS_CHANGED',
                                title: 'マイルストーン期限超過のお知らせ',
                                message: "\u300C".concat(project.title, "\u300D\u306E\u300C").concat(milestone.title, "\u300D\u306E\u671F\u9650\u304C\u904E\u304E\u3066\u3044\u307E\u3059"),
                                data: {
                                    projectId: project.id,
                                    milestoneId: milestone.id,
                                    scheduleId: milestone.scheduleId,
                                    type: 'milestone_overdue',
                                },
                            })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        console.log("Sent overdue notification for milestone ".concat(milestone.id, ": ").concat(milestone.title));
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _b.sent();
                        console.error("Failed to send overdue notification for milestone ".concat(milestone.id, ":"), error_4);
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 2];
                    case 10:
                        console.log("Overdue milestone notifications sent: ".concat(overdueMilestones.length));
                        return [3 /*break*/, 12];
                    case 11:
                        error_5 = _b.sent();
                        console.error('Error checking overdue milestones:', error_5);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    // v3.0 新機能: 一斉問い合わせの期限切れチェック
    NotificationService.checkExpiredInquiries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, expiredInquiries, _i, expiredInquiries_1, inquiry, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        now = new Date();
                        return [4 /*yield*/, prisma.bulkInquiry.findMany({
                                where: {
                                    deadline: {
                                        lt: now,
                                    },
                                },
                                include: {
                                    responses: {
                                        where: {
                                            status: 'PENDING',
                                        },
                                    },
                                },
                            })];
                    case 1:
                        expiredInquiries = _a.sent();
                        console.log("Found ".concat(expiredInquiries.length, " expired inquiries"));
                        _i = 0, expiredInquiries_1 = expiredInquiries;
                        _a.label = 2;
                    case 2:
                        if (!(_i < expiredInquiries_1.length)) return [3 /*break*/, 5];
                        inquiry = expiredInquiries_1[_i];
                        // 未回答の問い合わせを期限切れに更新
                        return [4 /*yield*/, prisma.inquiryResponse.updateMany({
                                where: {
                                    inquiryId: inquiry.id,
                                    status: 'PENDING',
                                },
                                data: {
                                    status: 'EXPIRED',
                                },
                            })];
                    case 3:
                        // 未回答の問い合わせを期限切れに更新
                        _a.sent();
                        console.log("Updated expired inquiry ".concat(inquiry.id, ": ").concat(inquiry.title));
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log("Expired inquiries updated: ".concat(expiredInquiries.length));
                        return [3 /*break*/, 7];
                    case 6:
                        error_6 = _a.sent();
                        console.error('Error checking expired inquiries:', error_6);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return NotificationService;
}());
exports.NotificationService = NotificationService;
