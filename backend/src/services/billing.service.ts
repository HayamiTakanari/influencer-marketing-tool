import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18' as any,
});

// Chapter 7: Billing and Invoice service
export class BillingService {
  // Generate invoice number
  static generateInvoiceNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}`;
  }

  // Create invoice for project
  static async createInvoice(projectId: string, clientId: string, influencerId: string, amount: number) {
    const tax = Math.floor(amount * 0.1); // 10% tax
    const totalAmount = amount + tax;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        clientId,
        influencerId,
        amount,
        tax,
        totalAmount,
        dueDate,
        invoiceNumber: this.generateInvoiceNumber(),
        status: 'PENDING',
      },
    });

    // Create notification
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { userId: true },
    });

    if (client) {
      await prisma.notification.create({
        data: {
          userId: client.userId,
          type: 'PAYMENT_COMPLETED',
          title: '請求書が生成されました',
          message: `プロジェクトの請求書が生成されました - 金額: ¥${totalAmount.toLocaleString('ja-JP')}`,
          data: {
            projectId,
            invoiceId: invoice.id,
          },
        },
      });
    }

    return invoice;
  }

  // Get pending invoices for user
  static async getPendingInvoices(userId: string, role: 'CLIENT' | 'INFLUENCER') {
    if (role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId },
      });

      if (!client) return [];

      return await prisma.invoice.findMany({
        where: {
          clientId: client.id,
          status: 'PENDING',
        },
      });
    } else {
      const influencer = await prisma.influencer.findUnique({
        where: { userId },
      });

      if (!influencer) return [];

      return await prisma.invoice.findMany({
        where: {
          influencerId: influencer.id,
          status: 'PENDING',
        },
      });
    }
  }

  // Mark invoice as paid
  static async markAsPaid(invoiceId: string, stripePaymentId?: string) {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Create notification for influencer
    const influencer = await prisma.influencer.findUnique({
      where: { id: invoice.influencerId },
      select: { userId: true },
    });

    if (influencer) {
      await prisma.notification.create({
        data: {
          userId: influencer.userId,
          type: 'PAYMENT_COMPLETED',
          title: '支払いが完了しました',
          message: `請求書の支払いが完了しました - 金額: ¥${invoice.totalAmount.toLocaleString('ja-JP')}`,
          data: {
            invoiceId,
          },
        },
      });
    }

    return invoice;
  }

  // Mark invoice as overdue
  static async markAsOverdue(invoiceId: string) {
    return await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'OVERDUE' },
    });
  }

  // Get invoice summary
  static async getInvoiceSummary(userId: string) {
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return { totalEarnings: 0, pending: 0, paid: 0 };
    }

    const invoices = await prisma.invoice.findMany({
      where: { influencerId: influencer.id },
    });

    const totalEarnings = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const paid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pending = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.totalAmount, 0);

    return { totalEarnings, pending, paid };
  }
}
