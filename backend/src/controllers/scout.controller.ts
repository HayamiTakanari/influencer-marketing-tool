import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chapter 3: Send scout invitation
export const sendScoutInvitation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { influencerId, projectId, message } = req.body;

    if (!influencerId || !projectId) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(403).json({ error: 'クライアント権限がありません' });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, title: true },
    });

    if (!project || project.clientId !== client.id) {
      return res.status(403).json({ error: 'プロジェクトの権限がありません' });
    }

    // Check if influencer exists
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      select: { userId: true, displayName: true },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサーが見つかりません' });
    }

    // Check for existing scout
    const existing = await prisma.scout.findUnique({
      where: {
        projectId_influencerId: {
          projectId,
          influencerId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'すでにスカウトを送信しています' });
    }

    // Create scout invitation
    const scoutRecord = await prisma.scout.create({
      data: {
        projectId,
        influencerId,
        clientId: client.id,
        message: message || null,
        status: 'PENDING',
      },
    });

    // Create notification for influencer
    await prisma.notification.create({
      data: {
        userId: influencer.userId,
        type: 'PROJECT_STATUS_CHANGED',
        title: 'スカウトを受け取りました',
        message: `「${project.title}」のスカウトをお受け取りました。ご確認をお願いします。`,
        data: {
          projectId,
          scoutId: scoutRecord.id,
        },
      },
    });

    res.status(201).json({
      message: 'スカウトを送信しました',
      scout: scoutRecord,
    });
  } catch (error) {
    console.error('Send scout error:', error);
    res.status(500).json({ error: 'スカウト送信に失敗しました' });
  }
};

// Chapter 3: Accept scout invitation
export const acceptScout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { scoutId } = req.params;

    const scoutRecord = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: {
        influencer: { select: { userId: true } },
        project: { select: { title: true, clientId: true } },
        client: { select: { userId: true } },
      },
    });

    if (!scoutRecord) {
      return res.status(404).json({ error: 'スカウトが見つかりません' });
    }

    // Verify influencer
    if (scoutRecord.influencer.userId !== userId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    if (scoutRecord.status !== 'PENDING') {
      return res.status(400).json({ error: 'このスカウトは処理済みです' });
    }

    // Update scout status
    const updated = await prisma.scout.update({
      where: { id: scoutId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Optionally match influencer to project
    await prisma.project.update({
      where: { id: scoutRecord.projectId },
      data: { matchedInfluencerId: scoutRecord.influencerId },
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: scoutRecord.client.userId,
        type: 'PROJECT_STATUS_CHANGED',
        title: 'スカウトが承認されました',
        message: `「${scoutRecord.project.title}」のスカウトが承認されました`,
        data: {
          projectId: scoutRecord.projectId,
          scoutId,
        },
      },
    });

    res.json({
      message: 'スカウトを承認しました',
      scout: updated,
    });
  } catch (error) {
    console.error('Accept scout error:', error);
    res.status(500).json({ error: 'スカウト承認に失敗しました' });
  }
};

// Chapter 3: Reject scout invitation
export const rejectScout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { scoutId } = req.params;
    const { reason } = req.body;

    const scoutRecord = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: {
        influencer: { select: { userId: true } },
        project: { select: { title: true } },
        client: { select: { userId: true } },
      },
    });

    if (!scoutRecord) {
      return res.status(404).json({ error: 'スカウトが見つかりません' });
    }

    // Verify influencer
    if (scoutRecord.influencer.userId !== userId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    if (scoutRecord.status !== 'PENDING') {
      return res.status(400).json({ error: 'このスカウトは処理済みです' });
    }

    // Update scout status
    const updated = await prisma.scout.update({
      where: { id: scoutId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: scoutRecord.client.userId,
        type: 'PROJECT_STATUS_CHANGED',
        title: 'スカウトが却下されました',
        message: `「${scoutRecord.project.title}」のスカウトが却下されました${reason ? `。理由: ${reason}` : ''}`,
        data: {
          projectId: scoutRecord.projectId,
          scoutId,
        },
      },
    });

    res.json({
      message: 'スカウトを却下しました',
      scout: updated,
    });
  } catch (error) {
    console.error('Reject scout error:', error);
    res.status(500).json({ error: 'スカウト却下に失敗しました' });
  }
};

// Chapter 3: Get scout invitations
export const getMyScoutInvitations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const status = req.query.status as string | undefined;

    const where: any = {
      influencer: { userId },
    };

    if (status) {
      where.status = status;
    }

    const scouts = await prisma.scout.findMany({
      where,
      include: {
        project: { select: { title: true, description: true } },
        client: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ scouts });
  } catch (error) {
    console.error('Get scouts error:', error);
    res.status(500).json({ error: 'スカウト取得に失敗しました' });
  }
};

// Chapter 3: Get sent scouts (for client)
export const getMySentScouts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const status = req.query.status as string | undefined;

    // Get client ID
    const client = await prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!client) {
      return res.status(403).json({ error: 'クライアント権限がありません' });
    }

    const where: any = {
      clientId: client.id,
    };

    if (status) {
      where.status = status;
    }

    const scouts = await prisma.scout.findMany({
      where,
      include: {
        project: { select: { title: true } },
        influencer: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ scouts });
  } catch (error) {
    console.error('Get sent scouts error:', error);
    res.status(500).json({ error: 'スカウト取得に失敗しました' });
  }
};

// Chapter 3: Get scout details
export const getScoutDetails = async (req: Request, res: Response) => {
  try {
    const { scoutId } = req.params;
    const userId = (req as any).user?.id;

    const scoutRecord = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: {
        project: true,
        influencer: { select: { userId: true, displayName: true } },
        client: { select: { userId: true } },
      },
    });

    if (!scoutRecord) {
      return res.status(404).json({ error: 'スカウトが見つかりません' });
    }

    // Verify access
    const hasAccess =
      scoutRecord.influencer.userId === userId || scoutRecord.client.userId === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: '権限がありません' });
    }

    res.json({ scout: scoutRecord });
  } catch (error) {
    console.error('Get scout details error:', error);
    res.status(500).json({ error: 'スカウト詳細取得に失敗しました' });
  }
};
