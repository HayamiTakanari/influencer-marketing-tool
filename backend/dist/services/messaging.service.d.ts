export declare class MessagingService {
    static getOrCreateChat(projectId: string, participantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        participantId: string;
        lastMessageAt: Date | null;
    }>;
    static sendMessage(projectId: string, chatId: string | null, senderId: string, receiverId: string, content: string): Promise<{
        sender: {
            id: string;
            email: string;
        };
        receiver: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        projectId: string;
        content: string;
        isRead: boolean;
        chatId: string | null;
        senderId: string;
        receiverId: string;
    }>;
    static getChatMessages(chatId: string, limit?: number, offset?: number): Promise<({
        sender: {
            id: string;
            email: string;
        };
        receiver: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        projectId: string;
        content: string;
        isRead: boolean;
        chatId: string | null;
        senderId: string;
        receiverId: string;
    })[]>;
    static markAsRead(messageIds: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    static getUnreadCount(userId: string): Promise<number>;
}
//# sourceMappingURL=messaging.service.d.ts.map