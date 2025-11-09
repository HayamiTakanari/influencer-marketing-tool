"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var notification_controller_1 = require("../controllers/notification.controller");
var router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get user notifications
router.get('/', notification_controller_1.getNotifications);
// Get unread notification count
router.get('/unread-count', notification_controller_1.getUnreadCount);
// Mark specific notification as read
router.put('/:notificationId/read', notification_controller_1.markAsRead);
// Mark all notifications as read
router.put('/mark-all-read', notification_controller_1.markAllAsRead);
// Delete notification
router.delete('/:notificationId', notification_controller_1.deleteNotification);
// Create system announcement (admin only)
router.post('/system-announcement', notification_controller_1.createSystemAnnouncement);
exports.default = router;
