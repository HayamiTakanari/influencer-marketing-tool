"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatList = exports.getUnreadCount = exports.markMessagesAsRead = exports.getMessages = exports.sendMessage = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const sendMessageSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    content: zod_1.z.string().min(1).max(1000),
});
const sendMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId, content } = sendMessageSchema.parse(req.body);
        // Get project to determine receiver
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: { user: true },
                },
                matchedInfluencer: {
                    include: { user: true },
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        // Determine receiver based on sender
        let receiverId;
        if (project.client.user.id === userId) {
            if (!project.matchedInfluencer) {
                return res.status(400).json({ error: 'No matched influencer for this project' });
            }
            receiverId = project.matchedInfluencer.user.id;
        }
        else if (project.matchedInfluencer?.user.id === userId) {
            receiverId = project.client.user.id;
        }
        else {
            return res.status(403).json({ error: 'Not authorized to send messages in this project' });
        }
        const message = await prisma.message.create({
            data: {
                projectId,
                senderId: userId,
                receiverId,
                content,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                    },
                },
            },
        });
        res.json(message);
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
exports.sendMessage = sendMessage;
const getMessages = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Verify user has access to this project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: { user: true },
                },
                matchedInfluencer: {
                    include: { user: true },
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const hasAccess = project.client.user.id === userId ||
            project.matchedInfluencer?.user.id === userId;
        if (!hasAccess) {
            return res.status(403).json({ error: 'Not authorized to view messages' });
        }
        const messages = await prisma.message.findMany({
            where: { projectId },
            include: {
                sender: {
                    select: {
                        id: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        res.json(messages.reverse());
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};
exports.getMessages = getMessages;
const markMessagesAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId } = req.params;
        // Verify user has access to this project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: { user: true },
                },
                matchedInfluencer: {
                    include: { user: true },
                },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const hasAccess = project.client.user.id === userId ||
            project.matchedInfluencer?.user.id === userId;
        if (!hasAccess) {
            return res.status(403).json({ error: 'Not authorized to mark messages as read' });
        }
        await prisma.message.updateMany({
            where: {
                projectId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        res.json({ message: 'Messages marked as read' });
    }
    catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};
exports.markMessagesAsRead = markMessagesAsRead;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const unreadCount = await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });
        res.json({ unreadCount });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};
exports.getUnreadCount = getUnreadCount;
const getChatList = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        let projects;
        if (userRole === 'CLIENT') {
            projects = await prisma.project.findMany({
                where: {
                    client: {
                        user: { id: userId },
                    },
                    status: {
                        in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'],
                    },
                },
                include: {
                    matchedInfluencer: {
                        select: {
                            displayName: true,
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });
        }
        else if (userRole === 'INFLUENCER') {
            projects = await prisma.project.findMany({
                where: {
                    matchedInfluencer: {
                        user: { id: userId },
                    },
                    status: {
                        in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'],
                    },
                },
                include: {
                    client: {
                        select: {
                            companyName: true,
                            contactName: true,
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });
        }
        else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
        const formattedChats = await Promise.all(projects.map(async (project) => {
            const unreadCount = await prisma.message.count({
                where: {
                    projectId: project.id,
                    receiverId: userId,
                    isRead: false,
                },
            });
            const lastMessage = project.messages[0];
            return {
                id: project.id,
                projectId: project.id,
                projectTitle: project.title,
                lastMessage: lastMessage?.content || '',
                lastMessageTime: lastMessage?.createdAt.toISOString() || project.updatedAt.toISOString(),
                unreadCount,
                sender: {
                    name: userRole === 'CLIENT'
                        ? project.matchedInfluencer?.displayName || 'インフルエンサー'
                        : project.client?.companyName || '企業',
                    role: userRole === 'CLIENT'
                        ? project.matchedInfluencer?.user.role || 'INFLUENCER'
                        : project.client?.user.role || 'CLIENT',
                },
            };
        }));
        res.json(formattedChats);
    }
    catch (error) {
        console.error('Get chat list error:', error);
        res.status(500).json({ error: 'Failed to get chat list' });
    }
};
exports.getChatList = getChatList;
