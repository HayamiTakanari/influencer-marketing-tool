import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chapter 9: Generate performance report
export const generatePerformanceReport = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const { startDate, endDate, format = 'json' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '開始日と終了日が必須です' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData: any = {};

    if (role === 'INFLUENCER') {
      const influencer = await prisma.influencer.findUnique({
        where: { userId },
        select: { id: true, displayName: true },
      });

      if (!influencer) {
        return res.status(403).json({ error: 'インフルエンサー権限がありません' });
      }

      // Get projects in date range
      const projects = await prisma.project.findMany({
        where: {
          matchedInfluencerId: influencer.id,
          createdAt: { gte: start, lte: end },
        },
      });

      // Get earnings in date range
      const invoices = await prisma.invoice.findMany({
        where: {
          influencerId: influencer.id,
          createdAt: { gte: start, lte: end },
        },
      });

      const totalEarnings = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidEarnings = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      // Get reviews
      const reviews = await prisma.review.findMany({
        where: {
          revieweeId: userId,
          createdAt: { gte: start, lte: end },
        },
      });

      const avgRating =
        reviews.length > 0
          ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
          : 0;

      reportData = {
        period: { startDate: start, endDate: end },
        influencerName: influencer.displayName,
        projects: projects.length,
        earnings: {
          total: totalEarnings,
          paid: paidEarnings,
          pending: totalEarnings - paidEarnings,
        },
        reviews: {
          count: reviews.length,
          averageRating: avgRating,
        },
      };
    } else if (role === 'COMPANY' || role === 'COMPANY') {
      const client = await prisma.company.findUnique({
        where: { userId },
        select: { id: true, companyName: true },
      });

      if (!client) {
        return res.status(403).json({ error: 'クライアント権限がありません' });
      }

      // Get projects in date range
      const projects = await prisma.project.findMany({
        where: {
          companyId: client.id,
          createdAt: { gte: start, lte: end },
        },
      });

      // Get applications
      const applications = await prisma.application.findMany({
        where: {
          companyId: client.id,
          appliedAt: { gte: start, lte: end },
        },
      });

      // Get invoices (as payer)
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId: client.id,
          createdAt: { gte: start, lte: end },
        },
      });

      const totalSpent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const paidAmount = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      reportData = {
        period: { startDate: start, endDate: end },
        companyName: client.companyName,
        projectsCreated: projects.length,
        applicationsReceived: applications.length,
        applicationsAccepted: applications.filter(a => a.isAccepted).length,
        spending: {
          total: totalSpent,
          paid: paidAmount,
          pending: totalSpent - paidAmount,
        },
      };
    }

    if (format === 'csv') {
      // Generate CSV format
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      res.send(csv);
    } else {
      res.json({ report: reportData });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'レポート生成に失敗しました' });
  }
};

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Add report header
  lines.push(`Report Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Add data
  const flattenData = (obj: any, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        flattenData(value, fullKey);
      } else {
        lines.push(`"${fullKey}","${value}"`);
      }
    }
  };

  flattenData(data);
  return lines.join('\n');
}

// Chapter 9: Export user data
export const exportUserData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { format = 'json' } = req.body;

    // Get all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        influencer: true,
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // Create data export record
    const dataExport = await prisma.dataExport.create({
      data: {
        userId,
        format,
        status: 'COMPLETED',
        completedAt: new Date(),
        dataType: 'ALL',
      },
    });

    if (format === 'csv') {
      const csv = convertToCSV(user);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user-data.csv"');
      res.send(csv);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');
      res.json(user);
    }
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'データエクスポートに失敗しました' });
  }
};

// Chapter 9: Get export history
export const getExportHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const exports = await prisma.dataExport.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });

    res.json({ exports });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ error: 'エクスポート履歴取得に失敗しました' });
  }
};
