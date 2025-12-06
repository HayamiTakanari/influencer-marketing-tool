import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDashboardData = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        influencer: {
          include: {
            socialAccounts: true,
            portfolio: true,
          }
        },
        company: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (userRole === 'INFLUENCER') {
      const projects = await prisma.project.count({
        where: {
          matchedInfluencerId: user.influencer?.id
        }
      });

      const activeProjects = await prisma.project.count({
        where: {
          matchedInfluencerId: user.influencer?.id,
          status: 'IN_PROGRESS'
        }
      });

      const achievements = await prisma.achievement.count({
        where: {
          influencerId: user.influencer?.id
        }
      });

      const totalFollowers = user.influencer?.socialAccounts.reduce(
        (sum, account) => sum + (account.followerCount || 0), 
        0
      ) || 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyEarnings = await prisma.transaction.aggregate({
        where: {
          project: {
            matchedInfluencerId: user.influencer?.id
          },
          status: 'completed',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          amount: true
        }
      });

      const availableProjects = await prisma.project.count({
        where: {
          status: 'PENDING',
          endDate: { gte: now }
        }
      });

      const recentProjects = await prisma.project.findMany({
        where: {
          matchedInfluencerId: user.influencer?.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: { company: {
            select: {
              companyName: true
            }
          }
        }
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.influencer
        },
        stats: {
          totalProjects: projects,
          activeProjects: activeProjects,
          totalAchievements: achievements,
          totalFollowers: totalFollowers,
          monthlyRevenue: monthlyEarnings._sum.amount || 0,
          newOffers: availableProjects
        },
        recentActivities: recentProjects.map(project => ({
          id: project.id,
          title: project.title,
          type: 'project',
          status: project.status,
          date: project.createdAt,
          companyName: project.company.companyName
        })),
        recentProjects: recentProjects.map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          budget: project.budget,
          startDate: project.startDate,
          endDate: project.endDate,
          companyName: project.company.companyName
        }))
      });
    } else if (userRole === 'COMPANY') {
      const projects = await prisma.project.count({
        where: {
          companyId: user.company?.id
        }
      });

      const activeProjects = await prisma.project.count({
        where: {
          companyId: user.company?.id,
          status: 'IN_PROGRESS'
        }
      });

      const recentProjects = await prisma.project.findMany({
        where: {
          companyId: user.company?.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true
        }
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.company
        },
        stats: {
          totalProjects: projects,
          activeProjects: activeProjects,
          totalSpending: 0,
          activeInfluencers: 0
        },
        recentActivities: recentProjects.map(project => ({
          id: project.id,
          title: project.title,
          type: 'project',
          status: project.status,
          date: project.createdAt
        }))
      });
    } else {
      res.status(400).json({ error: 'Invalid user role' });
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
