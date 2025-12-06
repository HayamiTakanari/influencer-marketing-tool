import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  createSystemAnnouncement,
} from '../controllers/notification.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Create system announcement (admin only)
router.post('/system-announcement', createSystemAnnouncement);

export default router;