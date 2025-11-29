"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSystemAnnouncement = exports.deleteNotification = exports.getUnreadCount = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const zod_1 = require("zod");
const notification_service_1 = require("../services/notification.service");
const getNotificationsSchema = zod_1.z.object({
    page: zod_1.z.number().default(1),
    limit: zod_1.z.number().default(20),
    unreadOnly: zod_1.z.boolean().default(false),
});
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = getNotificationsSchema.parse({
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            unreadOnly: req.query.unreadOnly === 'true',
        });
        const result = await notification_service_1.NotificationService.getUserNotifications(userId, query.page, query.limit, query.unreadOnly);
        res.json(result);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        await notification_service_1.NotificationService.markAsRead(notificationId, userId);
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await notification_service_1.NotificationService.markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};
exports.markAllAsRead = markAllAsRead;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notification_service_1.NotificationService.getUnreadCount(userId);
        res.json({ count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};
exports.getUnreadCount = getUnreadCount;
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        await notification_service_1.NotificationService.deleteNotification(notificationId, userId);
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
exports.deleteNotification = deleteNotification;
const createSystemAnnouncement = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can create system announcements' });
        }
        const { title, message, userIds, data } = zod_1.z.object({
            title: zod_1.z.string().min(1, 'Title is required'),
            message: zod_1.z.string().min(1, 'Message is required'),
            userIds: zod_1.z.array(zod_1.z.string()).optional(),
            data: zod_1.z.any().optional(),
        }).parse(req.body);
        let targetUserIds = userIds;
        // If no specific user IDs provided, send to all users
        if (!targetUserIds || targetUserIds.length === 0) {
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const users = await prisma.user.findMany({
                select: { id: true },
            });
            targetUserIds = users.map(user => user.id);
        }
        const notifications = await notification_service_1.NotificationService.createSystemAnnouncementNotification(targetUserIds, title, message, data);
        res.status(201).json({
            message: 'System announcement created',
            notificationCount: notifications.length,
        });
    }
    catch (error) {
        console.error('Create system announcement error:', error);
        res.status(500).json({ error: 'Failed to create system announcement' });
    }
};
exports.createSystemAnnouncement = createSystemAnnouncement;
//# sourceMappingURL=notification.controller.js.map