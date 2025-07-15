import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const sendMessageSchema = z.object({
  projectId: z.string(),
  content: z.string().min(1).max(1000),
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
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
    let receiverId: string;
    if (project.client.user.id === userId) {
      if (!project.matchedInfluencer) {
        return res.status(400).json({ error: 'No matched influencer for this project' });
      }
      receiverId = project.matchedInfluencer.user.id;
    } else if (project.matchedInfluencer?.user.id === userId) {
      receiverId = project.client.user.id;
    } else {
      return res.status(403).json({ error: 'Not authorized to send messages in this project' });
    }

    const message = await prisma.message.create({
      data: {
        projectId,
        senderId: userId!,
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
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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

    const hasAccess = 
      project.client.user.id === userId ||
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
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
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

    const hasAccess = 
      project.client.user.id === userId ||
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
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

export const getChatList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let projects: any[];

    if (userRole === 'CLIENT') {
      projects = await prisma.project.findMany({
        where: {
          client: {
            user: { id: userId },
          },
          status: 'MATCHED',
        },
        include: {
          matchedInfluencer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } else if (userRole === 'INFLUENCER') {
      projects = await prisma.project.findMany({
        where: {
          matchedInfluencer: {
            user: { id: userId },
          },
          status: 'MATCHED',
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } else {
      return res.status(403).json({ error: 'Invalid user role' });
    }

    // Get unread counts for each project
    const projectsWithUnreadCount = await Promise.all(
      projects.map(async (project) => {
        const unreadCount = await prisma.message.count({
          where: {
            projectId: project.id,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          ...project,
          unreadCount,
        };
      })
    );

    res.json(projectsWithUnreadCount);
  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({ error: 'Failed to get chat list' });
  }
};