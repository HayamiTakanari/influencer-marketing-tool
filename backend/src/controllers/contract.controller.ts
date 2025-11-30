import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chapter 5: Create contract
export const createContract = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { projectId, templateName } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectIdが必須です' });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: { select: { userId: true } } },
    });

    if (!project) {
      return res.status(404).json({ error: 'プロジェクトが見つかりません' });
    }

    if (project.client.userId !== userId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        projectId,
        templateName: templateName || null,
        status: 'PENDING',
      },
    });

    // Create notification for influencer
    if (project.matchedInfluencerId) {
      const influencer = await prisma.influencer.findUnique({
        where: { id: project.matchedInfluencerId },
        select: { userId: true },
      });

      if (influencer) {
        await prisma.notification.create({
          data: {
            userId: influencer.userId,
            type: 'PROJECT_STATUS_CHANGED',
            title: '契約書がご到着しました',
            message: `「${project.title}」の契約書がご到着しました。ご確認をお願いします。`,
            data: {
              projectId,
              contractId: contract.id,
            },
          },
        });
      }
    }

    res.status(201).json({
      message: '契約書を作成しました',
      contract,
    });
  } catch (error) {
    console.error('Contract creation error:', error);
    res.status(500).json({ error: '契約書作成に失敗しました' });
  }
};

// Chapter 5: Get contract
export const getContract = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { projectId },
      include: {
        project: { select: { title: true, clientId: true, matchedInfluencerId: true } },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: '契約書が見つかりません' });
    }

    res.json({ contract });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: '契約書取得に失敗しました' });
  }
};

// Chapter 5: Sign contract
export const signContract = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { contractId } = req.params;

    // Get contract and verify permission
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            client: { select: { userId: true } },
            matchedInfluencer: { select: { userId: true } },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: '契約書が見つかりません' });
    }

    // Verify permission (only client or matched influencer can sign)
    const canSign =
      contract.project.client.userId === userId ||
      contract.project.matchedInfluencer?.userId === userId;

    if (!canSign) {
      return res.status(403).json({ error: '権限がありません' });
    }

    // Update contract status
    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
      },
    });

    // Create notification for the other party
    const otherUserId =
      contract.project.client.userId === userId
        ? contract.project.matchedInfluencer?.userId
        : contract.project.client.userId;

    if (otherUserId) {
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: 'PROJECT_STATUS_CHANGED',
          title: '契約書が署名されました',
          message: `「${contract.project.title}」の契約書が署名されました`,
          data: {
            projectId: contract.projectId,
            contractId,
          },
        },
      });
    }

    res.json({
      message: '契約書に署名しました',
      contract: updated,
    });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: '署名に失敗しました' });
  }
};

// Chapter 5: Reject contract
export const rejectContract = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { contractId } = req.params;
    const { reason } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            client: { select: { userId: true } },
            matchedInfluencer: { select: { userId: true } },
          },
        },
      },
    });

    if (!contract) {
      return res.status(404).json({ error: '契約書が見つかりません' });
    }

    const canReject =
      contract.project.client.userId === userId ||
      contract.project.matchedInfluencer?.userId === userId;

    if (!canReject) {
      return res.status(403).json({ error: '権限がありません' });
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'REJECTED',
      },
    });

    // Notify the other party
    const otherUserId =
      contract.project.client.userId === userId
        ? contract.project.matchedInfluencer?.userId
        : contract.project.client.userId;

    if (otherUserId) {
      await prisma.notification.create({
        data: {
          userId: otherUserId,
          type: 'PROJECT_STATUS_CHANGED',
          title: '契約書が却下されました',
          message: `「${contract.project.title}」の契約書が却下されました${reason ? `。理由: ${reason}` : ''}`,
          data: {
            projectId: contract.projectId,
            contractId,
          },
        },
      });
    }

    res.json({
      message: '契約書を却下しました',
      contract: updated,
    });
  } catch (error) {
    console.error('Reject contract error:', error);
    res.status(500).json({ error: '却下に失敗しました' });
  }
};

// Chapter 5: Get my contracts
export const getMyContracts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Get contracts where user is involved
    const contracts = await prisma.contract.findMany({
      where: {
        project: {
          OR: [
            { client: { userId } },
            { matchedInfluencer: { userId } },
          ],
        },
      },
      include: {
        project: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ contracts });
  } catch (error) {
    console.error('Get my contracts error:', error);
    res.status(500).json({ error: '契約書取得に失敗しました' });
  }
};
