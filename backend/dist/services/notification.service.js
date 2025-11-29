"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class NotificationService {
    static async createNotification(notificationData) {
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
        }
        catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    }
    static async createApplicationReceivedNotification(clientUserId, projectTitle, influencerName, applicationId) {
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
    static async createApplicationAcceptedNotification(influencerUserId, projectTitle, companyName, projectId) {
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
    static async createApplicationRejectedNotification(influencerUserId, projectTitle, companyName) {
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
    static async createProjectMatchedNotification(influencerUserId, projectTitle, companyName, projectId) {
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
    static async createMessageReceivedNotification(receiverUserId, senderName, projectTitle, projectId) {
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
    static async createPaymentCompletedNotification(userId, amount, projectTitle, projectId) {
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
    static async createProjectStatusChangedNotification(userId, projectTitle, oldStatus, newStatus, projectId) {
        const statusLabels = {
            PENDING: '募集中',
            MATCHED: 'マッチング済み',
            IN_PROGRESS: '進行中',
            COMPLETED: '完了',
            CANCELLED: 'キャンセル',
        };
        const newStatusLabel = statusLabels[newStatus] || newStatus;
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
    static async createTeamInvitationNotification(userId, teamName, inviterName, teamId) {
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
    static async createSystemAnnouncementNotification(userIds, title, message, data) {
        const notifications = await Promise.all(userIds.map(userId => this.createNotification({
            userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            title,
            message,
            data,
        })));
        return notifications;
    }
    static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const skip = (page - 1) * limit;
        const where = { userId };
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
    static async markAsRead(notificationId, userId) {
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
    static async markAllAsRead(userId) {
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
    static async getUnreadCount(userId) {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    static async deleteNotification(notificationId, userId) {
        return prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId,
            },
        });
    }
    static async deleteOldNotifications(daysOld = 30) {
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
    // v3.0 新機能: マイルストーン前日通知
    static async sendMilestoneReminders() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);
            // 明日が期限のマイルストーンを取得
            const milestones = await prisma.milestone.findMany({
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
            });
            console.log(`Found ${milestones.length} milestones due tomorrow`);
            for (const milestone of milestones) {
                const project = milestone.schedule.project;
                try {
                    // クライアントに通知
                    if (project.client.userId) {
                        await this.createNotification({
                            userId: project.client.userId,
                            type: 'PROJECT_STATUS_CHANGED',
                            title: 'マイルストーン期限のお知らせ',
                            message: `「${project.title}」の「${milestone.title}」が明日期限です`,
                            data: {
                                projectId: project.id,
                                milestoneId: milestone.id,
                                scheduleId: milestone.scheduleId,
                                type: 'milestone_reminder',
                            },
                        });
                    }
                    // インフルエンサーに通知
                    if (project.matchedInfluencer?.userId) {
                        await this.createNotification({
                            userId: project.matchedInfluencer.userId,
                            type: 'PROJECT_STATUS_CHANGED',
                            title: 'マイルストーン期限のお知らせ',
                            message: `「${project.title}」の「${milestone.title}」が明日期限です`,
                            data: {
                                projectId: project.id,
                                milestoneId: milestone.id,
                                scheduleId: milestone.scheduleId,
                                type: 'milestone_reminder',
                            },
                        });
                    }
                    // 通知送信フラグを更新
                    await prisma.milestone.update({
                        where: { id: milestone.id },
                        data: { notificationSent: true },
                    });
                    console.log(`Sent reminder for milestone ${milestone.id}: ${milestone.title}`);
                }
                catch (error) {
                    console.error(`Failed to send reminder for milestone ${milestone.id}:`, error);
                }
            }
            console.log(`Milestone reminders sent: ${milestones.length}`);
        }
        catch (error) {
            console.error('Error sending milestone reminders:', error);
        }
    }
    // v3.0 新機能: 期限切れマイルストーンの確認
    static async checkOverdueMilestones() {
        try {
            const now = new Date();
            const overdueMilestones = await prisma.milestone.findMany({
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
            });
            console.log(`Found ${overdueMilestones.length} overdue milestones`);
            for (const milestone of overdueMilestones) {
                const project = milestone.schedule.project;
                try {
                    // クライアントに通知
                    if (project.client.userId) {
                        await this.createNotification({
                            userId: project.client.userId,
                            type: 'PROJECT_STATUS_CHANGED',
                            title: 'マイルストーン期限超過のお知らせ',
                            message: `「${project.title}」の「${milestone.title}」の期限が過ぎています`,
                            data: {
                                projectId: project.id,
                                milestoneId: milestone.id,
                                scheduleId: milestone.scheduleId,
                                type: 'milestone_overdue',
                            },
                        });
                    }
                    // インフルエンサーに通知
                    if (project.matchedInfluencer?.userId) {
                        await this.createNotification({
                            userId: project.matchedInfluencer.userId,
                            type: 'PROJECT_STATUS_CHANGED',
                            title: 'マイルストーン期限超過のお知らせ',
                            message: `「${project.title}」の「${milestone.title}」の期限が過ぎています`,
                            data: {
                                projectId: project.id,
                                milestoneId: milestone.id,
                                scheduleId: milestone.scheduleId,
                                type: 'milestone_overdue',
                            },
                        });
                    }
                    console.log(`Sent overdue notification for milestone ${milestone.id}: ${milestone.title}`);
                }
                catch (error) {
                    console.error(`Failed to send overdue notification for milestone ${milestone.id}:`, error);
                }
            }
            console.log(`Overdue milestone notifications sent: ${overdueMilestones.length}`);
        }
        catch (error) {
            console.error('Error checking overdue milestones:', error);
        }
    }
    // v3.0 新機能: 一斉問い合わせの期限切れチェック
    static async checkExpiredInquiries() {
        try {
            const now = new Date();
            const expiredInquiries = await prisma.bulkInquiry.findMany({
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
            });
            console.log(`Found ${expiredInquiries.length} expired inquiries`);
            for (const inquiry of expiredInquiries) {
                // 未回答の問い合わせを期限切れに更新
                await prisma.inquiryResponse.updateMany({
                    where: {
                        inquiryId: inquiry.id,
                        status: 'PENDING',
                    },
                    data: {
                        status: 'EXPIRED',
                    },
                });
                console.log(`Updated expired inquiry ${inquiry.id}: ${inquiry.title}`);
            }
            console.log(`Expired inquiries updated: ${expiredInquiries.length}`);
        }
        catch (error) {
            console.error('Error checking expired inquiries:', error);
        }
    }
}
exports.NotificationService = NotificationService;
