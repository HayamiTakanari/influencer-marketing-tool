"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const setupSocketServer = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.userId = user.id;
            socket.userRole = user.role;
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        // Join user to their own room
        socket.join(socket.userId);
        // Join project rooms
        socket.on('join-project', (projectId) => {
            socket.join(`project-${projectId}`);
        });
        // Leave project rooms
        socket.on('leave-project', (projectId) => {
            socket.leave(`project-${projectId}`);
        });
        // Handle new message
        socket.on('send-message', async (data) => {
            try {
                const { projectId, content } = data;
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
                    socket.emit('error', { message: 'Project not found' });
                    return;
                }
                // Determine receiver based on sender
                let receiverId;
                if (project.client.user.id === socket.userId) {
                    if (!project.matchedInfluencer) {
                        socket.emit('error', { message: 'No matched influencer for this project' });
                        return;
                    }
                    receiverId = project.matchedInfluencer.user.id;
                }
                else if (project.matchedInfluencer?.user.id === socket.userId) {
                    receiverId = project.client.user.id;
                }
                else {
                    socket.emit('error', { message: 'Not authorized to send messages in this project' });
                    return;
                }
                // Save message to database
                const message = await prisma.message.create({
                    data: {
                        projectId,
                        senderId: socket.userId,
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
                // Emit to project room
                io.to(`project-${projectId}`).emit('new-message', message);
                // Emit to receiver's personal room for notifications
                io.to(receiverId).emit('message-notification', {
                    projectId,
                    message,
                });
            }
            catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicators
        socket.on('typing-start', (projectId) => {
            socket.to(`project-${projectId}`).emit('user-typing', {
                userId: socket.userId,
                projectId,
            });
        });
        socket.on('typing-stop', (projectId) => {
            socket.to(`project-${projectId}`).emit('user-stop-typing', {
                userId: socket.userId,
                projectId,
            });
        });
        // Handle message read status
        socket.on('mark-messages-read', async (projectId) => {
            try {
                await prisma.message.updateMany({
                    where: {
                        projectId,
                        receiverId: socket.userId,
                        isRead: false,
                    },
                    data: {
                        isRead: true,
                    },
                });
                // Notify sender that messages were read
                socket.to(`project-${projectId}`).emit('messages-read', {
                    projectId,
                    readBy: socket.userId,
                });
            }
            catch (error) {
                console.error('Mark messages read error:', error);
            }
        });
        // Handle online status
        socket.on('user-online', () => {
            socket.broadcast.emit('user-status', {
                userId: socket.userId,
                status: 'online',
            });
        });
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
            // Notify others that user went offline
            socket.broadcast.emit('user-status', {
                userId: socket.userId,
                status: 'offline',
            });
        });
    });
    return io;
};
exports.setupSocketServer = setupSocketServer;
//# sourceMappingURL=socket.service.js.map