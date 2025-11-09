import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const createPaymentIntentSchema = z.object({
  projectId: z.string(),
  amount: z.number().min(100), // Minimum amount in cents/yen
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  projectId: z.string(),
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectId, amount } = createPaymentIntentSchema.parse(req.body);

    // Verify user is the client for this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: { user: true },
        },
        matchedInfluencer: {
          include: { user: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.client.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to create payment for this project' });
    }

    if (project.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Project must be in progress to create payment' });
    }

    // Calculate fee (e.g., 10% platform fee)
    const fee = Math.round(amount * 0.1);
    const totalAmount = amount + fee;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'jpy',
      metadata: {
        projectId,
        clientId: project.client.id,
        influencerId: project.matchedInfluencer?.id || '',
        originalAmount: amount.toString(),
        fee: fee.toString(),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      fee,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId, projectId } = confirmPaymentSchema.parse(req.body);

    // Verify user is the client for this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          include: { user: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.client.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to confirm payment for this project' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded' });
    }

    // Check if transaction already exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { stripePaymentId: paymentIntentId },
    });

    if (existingTransaction) {
      return res.status(400).json({ error: 'Transaction already recorded' });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        projectId,
        amount: parseInt(paymentIntent.metadata.originalAmount),
        fee: parseInt(paymentIntent.metadata.fee),
        stripePaymentId: paymentIntentId,
        status: 'completed',
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED' },
    });

    res.json({
      transaction,
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let whereClause: any = {};

    if (userRole === 'CLIENT' || userRole === 'COMPANY') {
      whereClause = {
        project: {
          client: {
            user: { id: userId },
          },
        },
      };
    } else if (userRole === 'INFLUENCER') {
      whereClause = {
        project: {
          matchedInfluencer: {
            user: { id: userId },
          },
        },
      };
    } else {
      return res.status(403).json({ error: 'Invalid user role' });
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: {
              select: {
                companyName: true,
                contactName: true,
              },
            },
            matchedInfluencer: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};

export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { transactionId } = req.params;

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        project: {
          include: {
            client: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only client can request refund
    if (transaction.project.client.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to refund this transaction' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed transactions can be refunded' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripePaymentId,
      amount: transaction.amount + transaction.fee,
    });

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'refunded' },
    });

    // Update project status
    await prisma.project.update({
      where: { id: transaction.projectId },
      data: { status: 'CANCELLED' },
    });

    res.json({
      refund,
      message: 'Payment refunded successfully',
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to refund payment' });
  }
};

export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'INFLUENCER') {
      return res.status(403).json({ error: 'Only influencers can access revenue stats' });
    }

    const whereClause = {
      project: {
        matchedInfluencer: {
          user: { id: userId },
        },
      },
      status: 'completed',
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalEarnings, currentMonthEarnings, completedProjects, recentProjects] = await Promise.all([
      prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          ...whereClause,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.count({
        where: whereClause,
      }),
      prisma.project.findMany({
        where: {
          matchedInfluencer: {
            user: { id: userId },
          },
          status: 'COMPLETED',
        },
        include: {
          client: {
            select: {
              companyName: true,
            },
          },
          transaction: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      }),
    ]);

    const totalEarned = totalEarnings._sum.amount || 0;
    const currentMonthEarned = currentMonthEarnings._sum.amount || 0;
    const averageProjectValue = completedProjects > 0 ? Math.round(totalEarned / completedProjects) : 0;

    const pendingPayments = await prisma.project.count({
      where: {
        matchedInfluencer: {
          user: { id: userId },
        },
        status: 'IN_PROGRESS',
      },
    });

    const formattedProjects = recentProjects.map(project => ({
      id: project.id,
      title: project.title,
      amount: project.transaction?.amount || 0,
      status: 'completed',
      completedAt: project.updatedAt.toISOString(),
      client: {
        companyName: project.client.companyName,
      },
    }));

    res.json({
      totalEarnings: totalEarned,
      currentMonthEarnings: currentMonthEarned,
      completedProjects,
      pendingPayments,
      averageProjectValue,
      recentProjects: formattedProjects,
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to get payment stats' });
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update transaction status to failed
      await prisma.transaction.updateMany({
        where: { stripePaymentId: failedPayment.id },
        data: { status: 'failed' },
      });
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};