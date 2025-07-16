import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  static async createNotification(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
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
      });

      // TODO: ここでリアルタイム通知やメール送信を実装
      // Example: WebSocket通知、プッシュ通知、メール送信など

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async createApplicationReceivedNotification(clientUserId: string, projectTitle: string, influencerName: string, applicationId: string) {
    return this.createNotification({
      userId: clientUserId,
      type: 'APPLICATION_RECEIVED',
      title: '新しい応募が届きました',
      message: `${influencerName}さんが「${projectTitle}」に応募しました。`,
      data: {
        applicationId,
        projectTitle,
        influencerName,
      },
    });
  }

  static async createApplicationAcceptedNotification(influencerUserId: string, projectTitle: string, companyName: string, projectId: string) {
    return this.createNotification({
      userId: influencerUserId,
      type: 'APPLICATION_ACCEPTED',
      title: '応募が承認されました！',
      message: `${companyName}が「${projectTitle}」への応募を承認しました。`,
      data: {
        projectId,
        projectTitle,
        companyName,
      },
    });
  }

  static async createApplicationRejectedNotification(influencerUserId: string, projectTitle: string, companyName: string) {
    return this.createNotification({
      userId: influencerUserId,
      type: 'APPLICATION_REJECTED',
      title: '応募結果のお知らせ',
      message: `${companyName}の「${projectTitle}」への応募が見送りとなりました。`,
      data: {
        projectTitle,
        companyName,
      },
    });
  }

  static async createProjectMatchedNotification(influencerUserId: string, projectTitle: string, companyName: string, projectId: string) {
    return this.createNotification({
      userId: influencerUserId,
      type: 'PROJECT_MATCHED',
      title: 'プロジェクトマッチング完了',
      message: `${companyName}の「${projectTitle}」とマッチングしました。プロジェクトを開始しましょう！`,
      data: {
        projectId,
        projectTitle,
        companyName,
      },
    });
  }

  static async createMessageReceivedNotification(receiverUserId: string, senderName: string, projectTitle: string, projectId: string) {
    return this.createNotification({
      userId: receiverUserId,
      type: 'MESSAGE_RECEIVED',
      title: '新しいメッセージ',
      message: `${senderName}さんから「${projectTitle}」についてメッセージが届きました。`,
      data: {
        projectId,
        projectTitle,
        senderName,
      },
    });
  }

  static async createPaymentCompletedNotification(userId: string, amount: number, projectTitle: string, projectId: string) {
    return this.createNotification({
      userId: userId,
      type: 'PAYMENT_COMPLETED',
      title: '支払いが完了しました',
      message: `「${projectTitle}」の支払い（¥${amount.toLocaleString()}）が完了しました。`,
      data: {
        projectId,
        projectTitle,
        amount,
      },
    });
  }

  static async createProjectStatusChangedNotification(userId: string, projectTitle: string, oldStatus: string, newStatus: string, projectId: string) {
    const statusLabels = {
      PENDING: '募集中',
      MATCHED: 'マッチング済み',
      IN_PROGRESS: '進行中',
      COMPLETED: '完了',
      CANCELLED: 'キャンセル',
    };

    const newStatusLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus;

    return this.createNotification({
      userId: userId,
      type: 'PROJECT_STATUS_CHANGED',
      title: 'プロジェクトステータス変更',
      message: `「${projectTitle}」のステータスが「${newStatusLabel}」に変更されました。`,
      data: {
        projectId,
        projectTitle,
        oldStatus,
        newStatus,
      },
    });
  }

  static async createTeamInvitationNotification(userId: string, teamName: string, inviterName: string, teamId: string) {
    return this.createNotification({
      userId: userId,
      type: 'TEAM_INVITATION',
      title: 'チームに招待されました',
      message: `${inviterName}さんが「${teamName}」チームに招待しました。`,
      data: {
        teamId,
        teamName,
        inviterName,
      },
    });
  }

  static async createSystemAnnouncementNotification(userIds: string[], title: string, message: string, data?: any) {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.createNotification({
          userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title,
          message,
          data,
        })
      )
    );

    return notifications;
  }

  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  static async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  static async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });
  }
}