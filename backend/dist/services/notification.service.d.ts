import { NotificationType } from '@prisma/client';
interface NotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
}
export declare class NotificationService {
    static createNotification(notificationData: NotificationData): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createApplicationReceivedNotification(clientUserId: string, projectTitle: string, influencerName: string, applicationId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createApplicationAcceptedNotification(influencerUserId: string, projectTitle: string, companyName: string, projectId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createApplicationRejectedNotification(influencerUserId: string, projectTitle: string, companyName: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createProjectMatchedNotification(influencerUserId: string, projectTitle: string, companyName: string, projectId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createMessageReceivedNotification(receiverUserId: string, senderName: string, projectTitle: string, projectId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createPaymentCompletedNotification(userId: string, amount: number, projectTitle: string, projectId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createProjectStatusChangedNotification(userId: string, projectTitle: string, oldStatus: string, newStatus: string, projectId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createTeamInvitationNotification(userId: string, teamName: string, inviterName: string, teamId: string): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    }>;
    static createSystemAnnouncementNotification(userIds: string[], title: string, message: string, data?: any): Promise<({
        user: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        title: string;
        userId: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        type: import(".prisma/client").$Enums.NotificationType;
        readAt: Date | null;
    })[]>;
    static getUserNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        notifications: {
            message: string;
            id: string;
            createdAt: Date;
            title: string;
            userId: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            isRead: boolean;
            type: import(".prisma/client").$Enums.NotificationType;
            readAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static getUnreadCount(userId: string): Promise<number>;
    static deleteNotification(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static deleteOldNotifications(daysOld?: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static sendMilestoneReminders(): Promise<void>;
    static checkOverdueMilestones(): Promise<void>;
    static checkExpiredInquiries(): Promise<void>;
}
export {};
//# sourceMappingURL=notification.service.d.ts.map