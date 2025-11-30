import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateCompanyProfileSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  industry: z.string().max(100).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  instagramUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  instagramUserId: z.string().min(1).max(100).optional().or(z.literal('').transform(() => undefined)),
  tiktokUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  tiktokUserId: z.string().min(1).max(100).optional().or(z.literal('').transform(() => undefined)),
  youtubeUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  youtubeUserId: z.string().min(1).max(100).optional().or(z.literal('').transform(() => undefined)),
  twitterUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  twitterUserId: z.string().min(1).max(100).optional().or(z.literal('').transform(() => undefined)),
  bankName: z.string().max(100).optional(),
  branchName: z.string().max(100).optional(),
  accountType: z.string().max(50).optional(),
  accountNumber: z.string().max(20).optional(),
  accountName: z.string().max(100).optional(),
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// 企業プロフィール取得
export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const company = await prisma.company.findUnique({
      where: { userId },
      include: {
        bankAccounts: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({ error: 'Failed to get company profile' });
  }
};

// 企業プロフィール更新
export const updateCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const data = updateCompanyProfileSchema.parse(req.body);

    // 企業プロフィールの更新（ない場合は作成）
    const company = await prisma.company.upsert({
      where: { userId },
      update: {
        companyName: data.companyName,
        industry: data.industry,
        address: data.address,
        phoneNumber: data.contactPhone,
        contactName: data.contactName,
        website: data.website,
        description: data.description,
        instagramUrl: data.instagramUrl || null,
        instagramUserId: data.instagramUserId || null,
        tiktokUrl: data.tiktokUrl || null,
        tiktokUserId: data.tiktokUserId || null,
        youtubeUrl: data.youtubeUrl || null,
        youtubeUserId: data.youtubeUserId || null,
        twitterUrl: data.twitterUrl || null,
        twitterUserId: data.twitterUserId || null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        companyName: data.companyName || 'New Company',
        industry: data.industry,
        address: data.address,
        phoneNumber: data.contactPhone,
        contactName: data.contactName,
        website: data.website,
        description: data.description,
        instagramUrl: data.instagramUrl || null,
        instagramUserId: data.instagramUserId || null,
        tiktokUrl: data.tiktokUrl || null,
        tiktokUserId: data.tiktokUserId || null,
        youtubeUrl: data.youtubeUrl || null,
        youtubeUserId: data.youtubeUserId || null,
        twitterUrl: data.twitterUrl || null,
        twitterUserId: data.twitterUserId || null,
      },
      include: {
        bankAccounts: true,
      },
    });

    // 銀行口座情報がある場合は更新または作成
    if (
      data.bankName ||
      data.branchName ||
      data.accountNumber ||
      data.accountName
    ) {
      const existingBankAccount = await prisma.bankAccount.findFirst({
        where: { companyId: company.id },
      });

      if (existingBankAccount) {
        // 既存の銀行口座を更新
        await prisma.bankAccount.update({
          where: { id: existingBankAccount.id },
          data: {
            accountHolder: data.accountName || existingBankAccount.accountHolder,
            bankName: data.bankName || existingBankAccount.bankName,
            branchName: data.branchName || existingBankAccount.branchName,
            accountNumber: data.accountNumber || existingBankAccount.accountNumber,
            accountType: data.accountType || existingBankAccount.accountType,
          },
        });
      } else {
        // 新しい銀行口座を作成
        if (data.bankName && data.accountNumber && data.accountName) {
          await prisma.bankAccount.create({
            data: {
              companyId: company.id,
              accountHolder: data.accountName,
              bankName: data.bankName,
              branchName: data.branchName || '',
              accountNumber: data.accountNumber,
              accountType: data.accountType || '普通',
              isDefault: true,
            },
          });
        }
      }
    }

    // 更新後のデータを取得して返す
    const updatedCompany = await prisma.company.findUnique({
      where: { userId },
      include: {
        bankAccounts: true,
      },
    });

    res.json({
      success: true,
      data: updatedCompany,
      message: '企業プロフィールが保存されました',
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: (error as any).errors
      });
    }
    res.status(500).json({ error: 'Failed to update company profile' });
  }
};
