import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BillingService } from '../services/billing.service';

const prisma = new PrismaClient();

// Chapter 7: Create invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { projectId, influencerId, amount } = req.body;

    if (!projectId || !influencerId || !amount) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    // Get client info
    const client = await prisma.company.findUnique({
      where: { userId },
    });

    if (!client) {
      return res.status(403).json({ error: 'クライアント権限がありません' });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, title: true },
    });

    if (!project || project.companyId !== client.id) {
      return res.status(403).json({ error: 'プロジェクトの権限がありません' });
    }

    const invoice = await BillingService.createInvoice(
      projectId,
      client.id,
      influencerId,
      amount
    );

    res.status(201).json({
      message: '請求書を作成しました',
      invoice,
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: '請求書作成に失敗しました' });
  }
};

// Chapter 7: Get pending invoices
export const getPendingInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role;

    if (!role) {
      return res.status(400).json({ error: 'ロール情報が必須です' });
    }

    const invoices = await BillingService.getPendingInvoices(
      userId,
      role as 'COMPANY' | 'INFLUENCER'
    );

    res.json({ invoices });
  } catch (error) {
    console.error('Get pending invoices error:', error);
    res.status(500).json({ error: '請求書取得に失敗しました' });
  }
};

// Chapter 7: Get invoice details
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const userId = (req as any).user?.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: { select: { title: true, company: { select: { userId: true } } } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: '請求書が見つかりません' });
    }

    // Verify access
    const hasAccess =
      invoice.project.company.userId === userId || invoice.influencerId === (req as any).user?.influencerId;

    if (!hasAccess) {
      return res.status(403).json({ error: '権限がありません' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: '請求書取得に失敗しました' });
  }
};

// Chapter 7: Mark invoice as paid
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { company: { select: { userId: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: '請求書が見つかりません' });
    }

    // Only client can mark as paid
    if (invoice.company.userId !== userId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    const updated = await BillingService.markAsPaid(invoiceId);

    res.json({
      message: '請求書を支払い済みにしました',
      invoice: updated,
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: '支払い処理に失敗しました' });
  }
};

// Chapter 7: Get invoice summary
export const getInvoiceSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const summary = await BillingService.getInvoiceSummary(userId);

    res.json({ summary });
  } catch (error) {
    console.error('Get invoice summary error:', error);
    res.status(500).json({ error: '請求書サマリー取得に失敗しました' });
  }
};
