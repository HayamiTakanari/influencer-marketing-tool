import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { InstagramService } from '../services/instagram.service';

const prisma = new PrismaClient();
const instagramService = new InstagramService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Get Instagram user information by username
 * GET /api/instagram/user/:username
 */
export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const userInfo = await instagramService.getUserInfoByUsername(username);

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error: any) {
    console.error('Get Instagram user info error:', error);
    res.status(500).json({
      error: 'Failed to fetch Instagram user information',
      message: error.message,
    });
  }
};

/**
 * Get Instagram user statistics
 * GET /api/instagram/user/:username/stats
 */
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const stats = await instagramService.getUserStats(username);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get Instagram user stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch Instagram user statistics',
      message: error.message,
    });
  }
};

/**
 * Verify Instagram account and save it to profile
 * POST /api/instagram/verify-account
 * Body: { username: string, displayName?: string }
 */
export const verifyAndAddAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, displayName } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'username is required' });
    }

    // Get user info
    const userInfo = await instagramService.getUserInfoByUsername(username);

    // Find or create influencer profile
    let influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      influencer = await prisma.influencer.create({
        data: {
          userId,
          displayName: displayName || userInfo.username,
          isRegistered: false,
        },
      });
    }

    // Check if Instagram account already exists
    let socialAccount = await prisma.socialAccount.findUnique({
      where: {
        influencerId_platform: {
          influencerId: influencer.id,
          platform: 'INSTAGRAM',
        },
      },
    });

    if (socialAccount) {
      // Update existing account
      socialAccount = await prisma.socialAccount.update({
        where: { id: socialAccount.id },
        data: {
          username: userInfo.username,
          profileUrl: `https://www.instagram.com/${userInfo.username}`,
          isVerified: true,
          lastSynced: new Date(),
        },
      });
    } else {
      // Create new account
      socialAccount = await prisma.socialAccount.create({
        data: {
          influencerId: influencer.id,
          platform: 'INSTAGRAM',
          username: userInfo.username,
          profileUrl: `https://www.instagram.com/${userInfo.username}`,
          isVerified: true,
          isConnected: true,
          lastSynced: new Date(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        socialAccount,
        userInfo,
      },
      message: 'Instagram account verified and added successfully',
    });
  } catch (error: any) {
    console.error('Verify Instagram account error:', error);
    res.status(500).json({
      error: 'Failed to verify Instagram account',
      message: error.message,
    });
  }
};
