"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 4: Messaging service for project communication
class MessagingService {
    // Create or get a chat for a project
    static async getOrCreateChat(projectId, participantId) {
        let chat = await prisma.chat.findUnique({
            where: {
                projectId_participantId: {
                    projectId,
                    participantId,
                },
            },
        });
        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    projectId,
                    participantId,
                },
            });
        }
        return chat;
    }
    // Send a message
    static async sendMessage(projectId, chatId, senderId, receiverId, content) {
        const data = {
            projectId,
            senderId,
            receiverId,
            content,
        };
        if (chatId) {
            data.chatId = chatId;
        }
        const message = await prisma.message.create({
            data,
            include: {
                sender: { select: { id: true, email: true } },
                receiver: { select: { id: true, email: true } },
            },
        });
        // Update chat's lastMessageAt
        if (chatId) {
            await prisma.chat.update({
                where: { id: chatId },
                data: { lastMessageAt: new Date() },
            });
        }
        // Create notification
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'MESSAGE_RECEIVED',
                title: 'メッセージを受け取りました',
                message: `新しいメッセージが届きました`,
                data: {
                    projectId,
                    senderId,
                    messageId: message.id,
                },
            },
        });
        return message;
    }
    // Get chat messages
    static async getChatMessages(chatId, limit = 50, offset = 0) {
        return await prisma.message.findMany({
            where: { chatId },
            include: {
                sender: { select: { id: true, email: true } },
                receiver: { select: { id: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    // Mark messages as read
    static async markAsRead(messageIds) {
        return await prisma.message.updateMany({
            where: { id: { in: messageIds } },
            data: { isRead: true },
        });
    }
    // Get unread message count
    static async getUnreadCount(userId) {
        return await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });
    }
}
exports.MessagingService = MessagingService;
//# sourceMappingURL=messaging.service.js.map