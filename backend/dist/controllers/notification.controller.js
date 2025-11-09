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
exports.createSystemAnnouncement = exports.deleteNotification = exports.getUnreadCount = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
var zod_1 = require("zod");
var notification_service_1 = require("../services/notification.service");
var getNotificationsSchema = zod_1.z.object({
    page: zod_1.z.number().default(1),
    limit: zod_1.z.number().default(20),
    unreadOnly: zod_1.z.boolean().default(false),
});
var getNotifications = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, query, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                query = getNotificationsSchema.parse({
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20,
                    unreadOnly: req.query.unreadOnly === 'true',
                });
                return [4 /*yield*/, notification_service_1.NotificationService.getUserNotifications(userId, query.page, query.limit, query.unreadOnly)];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Get notifications error:', error_1);
                res.status(500).json({ error: 'Failed to get notifications' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getNotifications = getNotifications;
var markAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, notificationId, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                notificationId = req.params.notificationId;
                return [4 /*yield*/, notification_service_1.NotificationService.markAsRead(notificationId, userId)];
            case 1:
                _a.sent();
                res.json({ message: 'Notification marked as read' });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Mark notification as read error:', error_2);
                res.status(500).json({ error: 'Failed to mark notification as read' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.markAsRead = markAsRead;
var markAllAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, notification_service_1.NotificationService.markAllAsRead(userId)];
            case 1:
                _a.sent();
                res.json({ message: 'All notifications marked as read' });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Mark all notifications as read error:', error_3);
                res.status(500).json({ error: 'Failed to mark all notifications as read' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.markAllAsRead = markAllAsRead;
var getUnreadCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, count, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, notification_service_1.NotificationService.getUnreadCount(userId)];
            case 1:
                count = _a.sent();
                res.json({ count: count });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Get unread count error:', error_4);
                res.status(500).json({ error: 'Failed to get unread count' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getUnreadCount = getUnreadCount;
var deleteNotification = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, notificationId, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                notificationId = req.params.notificationId;
                return [4 /*yield*/, notification_service_1.NotificationService.deleteNotification(notificationId, userId)];
            case 1:
                _a.sent();
                res.json({ message: 'Notification deleted' });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Delete notification error:', error_5);
                res.status(500).json({ error: 'Failed to delete notification' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteNotification = deleteNotification;
var createSystemAnnouncement = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userRole, _a, title, message, userIds, data, targetUserIds, PrismaClient, prisma, users, notifications, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userRole = req.user.role;
                if (userRole !== 'ADMIN') {
                    return [2 /*return*/, res.status(403).json({ error: 'Only admins can create system announcements' })];
                }
                _a = zod_1.z.object({
                    title: zod_1.z.string().min(1, 'Title is required'),
                    message: zod_1.z.string().min(1, 'Message is required'),
                    userIds: zod_1.z.array(zod_1.z.string()).optional(),
                    data: zod_1.z.any().optional(),
                }).parse(req.body), title = _a.title, message = _a.message, userIds = _a.userIds, data = _a.data;
                targetUserIds = userIds;
                if (!(!targetUserIds || targetUserIds.length === 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, Promise.resolve().then(function () { return require('@prisma/client'); })];
            case 1:
                PrismaClient = (_b.sent()).PrismaClient;
                prisma = new PrismaClient();
                return [4 /*yield*/, prisma.user.findMany({
                        select: { id: true },
                    })];
            case 2:
                users = _b.sent();
                targetUserIds = users.map(function (user) { return user.id; });
                _b.label = 3;
            case 3: return [4 /*yield*/, notification_service_1.NotificationService.createSystemAnnouncementNotification(targetUserIds, title, message, data)];
            case 4:
                notifications = _b.sent();
                res.status(201).json({
                    message: 'System announcement created',
                    notificationCount: notifications.length,
                });
                return [3 /*break*/, 6];
            case 5:
                error_6 = _b.sent();
                console.error('Create system announcement error:', error_6);
                res.status(500).json({ error: 'Failed to create system announcement' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createSystemAnnouncement = createSystemAnnouncement;
