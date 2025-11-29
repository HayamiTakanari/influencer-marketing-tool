import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { YouTubeService } from '../services/youtube.service';

const prisma = new PrismaClient();
const youtubeService = new YouTubeService();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Get YouTube channel information by username/handle
 * GET /api/youtube/channel/:username
 */
export const getChannelInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const channelInfo = await youtubeService.getChannelInfoByUsername(username);

    res.json({
      success: true,
      data: channelInfo,
    });
  } catch (error: any) {
    console.error('Get YouTube channel info error:', error);
    res.status(500).json({
      error: 'Failed to fetch YouTube channel information',
      message: error.message,
    });
  }
};

/**
 * Get YouTube channel statistics
 * GET /api/youtube/channel/:username/stats
 */
export const getChannelStats = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const stats = await youtubeService.getChannelStats(username);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get YouTube channel stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch YouTube channel statistics',
      message: error.message,
    });
  }
};

/**
 * Verify YouTube channel and save it to profile
 * POST /api/youtube/verify-account
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

    // Get channel info
    const channelInfo = await youtubeService.getChannelInfoByUsername(username);

    // Find or create influencer profile
    let influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      influencer = await prisma.influencer.create({
        data: {
          userId,
          displayName: displayName || channelInfo.username,
          isRegistered: false,
        },
      });
    }

    // Check if YouTube account already exists
    let socialAccount = await prisma.socialAccount.findUnique({
      where: {
        influencerId_platform: {
          influencerId: influencer.id,
          platform: 'YOUTUBE',
        },
      },
    });

    if (socialAccount) {
      // Update existing account
      socialAccount = await prisma.socialAccount.update({
        where: { id: socialAccount.id },
        data: {
          username: channelInfo.username,
          profileUrl: `https://www.youtube.com/@${channelInfo.username}`,
          isVerified: true,
          lastSynced: new Date(),
        },
      });
    } else {
      // Create new account
      socialAccount = await prisma.socialAccount.create({
        data: {
          influencerId: influencer.id,
          platform: 'YOUTUBE',
          username: channelInfo.username,
          profileUrl: `https://www.youtube.com/@${channelInfo.username}`,
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
        channelInfo,
      },
      message: 'YouTube channel verified and added successfully',
    });
  } catch (error: any) {
    console.error('Verify YouTube account error:', error);
    res.status(500).json({
      error: 'Failed to verify YouTube channel',
      message: error.message,
    });
  }
};
