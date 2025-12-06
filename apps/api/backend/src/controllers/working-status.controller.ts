import { Request, Response } from 'express';
import {
  updateWorkingStatus,
  getWorkingStatus,
  validateWorkingStatusData,
  getStatusDescription,
} from '../services/working-status.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

/**
 * Chapter 1-8: 稼働状況を更新
 */
export const updateStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, statusMessage, preferredMinPrice, preferredMaxPrice, preferredCategories, preferredPlatforms, preferredMinDays } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // バリデーション
    const errors = validateWorkingStatusData({
      status,
      statusMessage,
      preferredMinPrice,
      preferredMaxPrice,
      preferredCategories,
      preferredPlatforms,
      preferredMinDays,
    });

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const result = await updateWorkingStatus(influencer.id, {
      status,
      statusMessage,
      preferredMinPrice,
      preferredMaxPrice,
      preferredCategories,
      preferredPlatforms,
      preferredMinDays,
    });

    res.status(200).json({
      message: 'Working status updated successfully',
      ...result,
      description: getStatusDescription(status),
    });
  } catch (error) {
    console.error('Error updating working status:', error);
    res.status(500).json({ error: 'Failed to update working status' });
  }
};

/**
 * Chapter 1-8: 稼働状況を取得
 */
export const getStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const result = await getWorkingStatus(influencer.id);

    res.status(200).json({
      ...result,
      description: getStatusDescription(result.workingStatus),
    });
  } catch (error) {
    console.error('Error getting working status:', error);
    res.status(500).json({ error: 'Failed to get working status' });
  }
};

/**
 * 稼働状況の選択肢と説明を取得
 */
export const getStatusOptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const statuses = ['AVAILABLE', 'BUSY', 'UNAVAILABLE', 'BREAK'];
    const options = statuses.map((status: any) => ({
      value: status,
      label: {
        AVAILABLE: '積極的に受付中',
        BUSY: '選んで受付中',
        UNAVAILABLE: '現在多忙',
        BREAK: '長期休暇中',
      }[status],
      description: getStatusDescription(status),
    }));

    res.status(200).json({ statuses: options });
  } catch (error) {
    console.error('Error getting status options:', error);
    res.status(500).json({ error: 'Failed to get status options' });
  }
};
