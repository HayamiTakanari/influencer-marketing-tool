import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their own room
    socket.join(socket.userId!);

    // Join project rooms
    socket.on('join-project', (projectId: string) => {
      socket.join(`project-${projectId}`);
    });

    // Leave project rooms
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project-${projectId}`);
    });

    // Handle new message
    socket.on('send-message', async (data: { projectId: string; content: string }) => {
      try {
        const { projectId, content } = data;

        // Get project to determine receiver
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { company: {
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
        let receiverId: string;
        if (project.company.user.id === socket.userId) {
          if (!project.matchedInfluencer) {
            socket.emit('error', { message: 'No matched influencer for this project' });
            return;
          }
          receiverId = project.matchedInfluencer.user.id;
        } else if (project.matchedInfluencer?.user.id === socket.userId) {
          receiverId = project.company.user.id;
        } else {
          socket.emit('error', { message: 'Not authorized to send messages in this project' });
          return;
        }

        // Save message to database
        const message = await prisma.message.create({
          data: {
            projectId,
            senderId: socket.userId!,
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

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (projectId: string) => {
      socket.to(`project-${projectId}`).emit('user-typing', {
        userId: socket.userId,
        projectId,
      });
    });

    socket.on('typing-stop', (projectId: string) => {
      socket.to(`project-${projectId}`).emit('user-stop-typing', {
        userId: socket.userId,
        projectId,
      });
    });

    // Handle message read status
    socket.on('mark-messages-read', async (projectId: string) => {
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

      } catch (error) {
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