import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createServicePricingSchema, updateServicePricingSchema, bulkServicePricingSchema } from '../schemas/servicePricing';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// v3.0 新機能: 料金体系管理コントローラー

export const createServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみ料金を設定できます' });
    }

    const validatedData = createServicePricingSchema.parse(req.body);
    
    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    const servicePricing = await prisma.servicePricing.create({
      data: {
        ...validatedData,
        influencerId: influencer.id,
      },
    });

    res.status(201).json({
      message: '料金設定を登録しました',
      servicePricing,
    });
  } catch (error) {
    console.error('Create service pricing error:', error);
    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({ 
        error: 'バリデーションエラー',
        details: error.issues 
      });
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'このサービスタイプの料金は既に設定されています' });
    }
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const bulkCreateServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみ料金を設定できます' });
    }

    const validatedData = bulkServicePricingSchema.parse(req.body);
    
    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    // 既存の料金設定を削除
    await prisma.servicePricing.deleteMany({
      where: { influencerId: influencer.id },
    });

    // 新しい料金設定を一括登録
    const servicePricings = await Promise.all(
      validatedData.map(data => 
        prisma.servicePricing.create({
          data: {
            ...data,
            influencerId: influencer.id,
          },
        })
      )
    );

    res.status(201).json({
      message: '料金設定を一括登録しました',
      servicePricings,
    });
  } catch (error) {
    console.error('Bulk create service pricing error:', error);
    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({ 
        error: 'バリデーションエラー',
        details: error.issues 
      });
    }
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getMyServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみアクセスできます' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    const servicePricings = await prisma.servicePricing.findMany({
      where: { influencerId: influencer.id },
      orderBy: { serviceType: 'asc' },
    });

    res.json({ servicePricings });
  } catch (error) {
    console.error('Get service pricing error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const getServicePricingByInfluencer = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;
    const { serviceType, isActive } = req.query;

    const where: any = { influencerId };
    
    if (serviceType) {
      where.serviceType = serviceType;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const servicePricings = await prisma.servicePricing.findMany({
      where,
      orderBy: { serviceType: 'asc' },
    });

    res.json({ servicePricings });
  } catch (error) {
    console.error('Get service pricing by influencer error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const updateServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみ料金を更新できます' });
    }

    const validatedData = updateServicePricingSchema.parse(req.body);
    
    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    // 料金設定の所有者確認
    const existingServicePricing = await prisma.servicePricing.findFirst({
      where: {
        id,
        influencerId: influencer.id,
      },
    });

    if (!existingServicePricing) {
      return res.status(404).json({ error: '料金設定が見つかりません' });
    }

    const servicePricing = await prisma.servicePricing.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: '料金設定を更新しました',
      servicePricing,
    });
  } catch (error) {
    console.error('Update service pricing error:', error);
    if (error instanceof Error && 'issues' in error) {
      return res.status(400).json({ 
        error: 'バリデーションエラー',
        details: error.issues 
      });
    }
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const deleteServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみ料金を削除できます' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    // 料金設定の所有者確認
    const existingServicePricing = await prisma.servicePricing.findFirst({
      where: {
        id,
        influencerId: influencer.id,
      },
    });

    if (!existingServicePricing) {
      return res.status(404).json({ error: '料金設定が見つかりません' });
    }

    await prisma.servicePricing.delete({
      where: { id },
    });

    res.json({ message: '料金設定を削除しました' });
  } catch (error) {
    console.error('Delete service pricing error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

export const validateServicePricing = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user || user.role !== 'INFLUENCER') {
      return res.status(403).json({ error: 'インフルエンサーのみアクセスできます' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { userId: user.userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'インフルエンサー情報が見つかりません' });
    }

    const servicePricings = await prisma.servicePricing.findMany({
      where: { 
        influencerId: influencer.id,
        isActive: true,
      },
    });

    const requiredServices = [
      'PHOTOGRAPHY',
      'VIDEO_EDITING',
      'CONTENT_CREATION',
      'POSTING'
    ];

    const missingServices = requiredServices.filter(service => 
      !servicePricings.some(sp => sp.serviceType === service)
    );

    const isValid = missingServices.length === 0;

    res.json({
      isValid,
      missingServices,
      currentPricings: servicePricings,
    });
  } catch (error) {
    console.error('Validate service pricing error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};