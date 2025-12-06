import { Request, Response } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';

const getNotificationsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  unreadOnly: z.boolean().default(false),
});

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = getNotificationsSchema.parse({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      unreadOnly: req.query.unreadOnly === 'true',
    });

    const result = await NotificationService.getUserNotifications(
      userId,
      query.page,
      query.limit,
      query.unreadOnly
    );

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { notificationId } = req.params;

    await NotificationService.markAsRead(notificationId, userId);

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await NotificationService.markAllAsRead(userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const count = await NotificationService.getUnreadCount(userId);

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { notificationId } = req.params;

    await NotificationService.deleteNotification(notificationId, userId);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

export const createSystemAnnouncement = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create system announcements' });
    }

    const { title, message, userIds, data } = z.object({
      title: z.string().min(1, 'Title is required'),
      message: z.string().min(1, 'Message is required'),
      userIds: z.array(z.string()).optional(),
      data: z.any().optional(),
    }).parse(req.body);

    let targetUserIds = userIds;
    
    // If no specific user IDs provided, send to all users
    if (!targetUserIds || targetUserIds.length === 0) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const users = await prisma.user.findMany({
        select: { id: true },
      });
      
      targetUserIds = users.map(user => user.id);
    }

    const notifications = await NotificationService.createSystemAnnouncementNotification(
      targetUserIds,
      title,
      message,
      data
    );

    res.status(201).json({
      message: 'System announcement created',
      notificationCount: notifications.length,
    });
  } catch (error) {
    console.error('Create system announcement error:', error);
    res.status(500).json({ error: 'Failed to create system announcement' });
  }
};