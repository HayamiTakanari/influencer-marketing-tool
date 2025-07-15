import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SNSSyncService } from '../services/sns.service';

const prisma = new PrismaClient();
const snsService = new SNSSyncService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const syncSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { socialAccountId } = req.params;
    
    const result = await snsService.syncSocialAccount(socialAccountId);
    
    res.json({
      message: 'Social account synced successfully',
      data: result,
    });
  } catch (error) {
    console.error('Sync social account error:', error);
    res.status(500).json({ error: 'Failed to sync social account' });
  }
};

export const syncAllMyAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Get influencer
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    const result = await snsService.syncAllInfluencerAccounts(influencer.id);
    
    res.json({
      message: 'All social accounts synced',
      data: result,
    });
  } catch (error) {
    console.error('Sync all accounts error:', error);
    res.status(500).json({ error: 'Failed to sync all accounts' });
  }
};

export const getSyncStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            lastSynced: true,
            followerCount: true,
            engagementRate: true,
            isVerified: true,
          },
        },
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    res.json({
      totalAccounts: influencer.socialAccounts.length,
      accounts: influencer.socialAccounts,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
};

// Admin endpoint to sync all influencers
export const syncAllInfluencers = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Run sync in background
    snsService.scheduleSyncForAllInfluencers()
      .catch(error => console.error('Background sync error:', error));

    res.json({
      message: 'Sync started for all influencers',
    });
  } catch (error) {
    console.error('Sync all influencers error:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
};