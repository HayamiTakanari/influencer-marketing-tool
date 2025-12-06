import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();

export const agreeToNDA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only influencers need to explicitly agree to NDA when matched with a project
    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers need to agree to NDA' });
    }

    // Get influencer profile
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    // Find the project that the influencer is matched with
    const project = await prisma.project.findFirst({
      where: {
        matchedInfluencerId: influencer.id,
        status: 'MATCHED',
      },
      include: { company: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
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
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'No matched project found' });
    }

    // Update project status to IN_PROGRESS to enable messaging
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: 'IN_PROGRESS',
      },
      include: { company: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
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
      },
    });

    // Send notification to client that NDA was approved
    try {
      if (project.matchedInfluencer && project.company) {
        await NotificationService.createNDAApprovedNotification(
          project.company.userId,
          project.title,
          project.matchedInfluencer.displayName,
          project.id
        );

        // Add system message to chat about NDA approval
        await prisma.message.create({
          data: {
            projectId: project.id,
            senderId: project.matchedInfluencer.userId,
            receiverId: project.company.userId,
            content: `${project.matchedInfluencer.displayName}さんがNDA（秘密保持契約）を承認しました。`,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send NDA approval notification:', error);
    }

    res.json({
      message: 'NDA agreement recorded successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Agree to NDA error:', error);
    res.status(500).json({ error: 'Failed to record NDA agreement' });
  }
};
