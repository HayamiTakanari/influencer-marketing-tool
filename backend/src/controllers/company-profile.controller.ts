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
  website: z.union([
    z.string().url(),
    z.string().max(0)  // Allow empty string
  ]).optional(),
  description: z.string().max(2000).optional(),
  instagramUrl: z.union([
    z.string().url(),
    z.string().max(0)  // Allow empty string
  ]).optional().nullable(),
  instagramUserId: z.string().max(100).optional().nullable(),
  tiktokUrl: z.union([
    z.string().url(),
    z.string().max(0)  // Allow empty string
  ]).optional().nullable(),
  tiktokUserId: z.string().max(100).optional().nullable(),
  youtubeUrl: z.union([
    z.string().url(),
    z.string().max(0)  // Allow empty string
  ]).optional().nullable(),
  youtubeUserId: z.string().max(100).optional().nullable(),
  twitterUrl: z.union([
    z.string().url(),
    z.string().max(0)  // Allow empty string
  ]).optional().nullable(),
  twitterUserId: z.string().max(100).optional().nullable(),
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

    console.log('=== updateCompanyProfile Debug Log ===');
    console.log('Request body:', req.body);

    const data = updateCompanyProfileSchema.parse(req.body);
    console.log('Parsed data:', data);

    // Helper function to convert empty strings to null, keep undefined as undefined
    const normalizeValue = (value: any) => {
      if (value === '') return null;
      return value;
    };

    // Build update object - only include fields that are explicitly provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Add fields if they are explicitly provided (not undefined)
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.contactPhone !== undefined) updateData.phoneNumber = data.contactPhone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.instagramUrl !== undefined) updateData.instagramUrl = normalizeValue(data.instagramUrl);
    if (data.instagramUserId !== undefined) updateData.instagramUserId = normalizeValue(data.instagramUserId);
    if (data.tiktokUrl !== undefined) updateData.tiktokUrl = normalizeValue(data.tiktokUrl);
    if (data.tiktokUserId !== undefined) updateData.tiktokUserId = normalizeValue(data.tiktokUserId);
    if (data.youtubeUrl !== undefined) updateData.youtubeUrl = normalizeValue(data.youtubeUrl);
    if (data.youtubeUserId !== undefined) updateData.youtubeUserId = normalizeValue(data.youtubeUserId);
    if (data.twitterUrl !== undefined) updateData.twitterUrl = normalizeValue(data.twitterUrl);
    if (data.twitterUserId !== undefined) updateData.twitterUserId = normalizeValue(data.twitterUserId);

    console.log('Upserting company profile with SNS data:', {
      instagramUserId: data.instagramUserId,
      tiktokUserId: data.tiktokUserId,
      youtubeUserId: data.youtubeUserId,
      twitterUserId: data.twitterUserId,
    });

    const company = await prisma.company.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        companyName: data.companyName || 'New Company',
        industry: data.industry,
        address: data.address,
        phoneNumber: data.contactPhone,
        contactName: data.contactName,
        website: data.website,
        description: data.description,
        instagramUrl: normalizeValue(data.instagramUrl),
        instagramUserId: normalizeValue(data.instagramUserId),
        tiktokUrl: normalizeValue(data.tiktokUrl),
        tiktokUserId: normalizeValue(data.tiktokUserId),
        youtubeUrl: normalizeValue(data.youtubeUrl),
        youtubeUserId: normalizeValue(data.youtubeUserId),
        twitterUrl: normalizeValue(data.twitterUrl),
        twitterUserId: normalizeValue(data.twitterUserId),
      },
      include: {
        bankAccounts: true,
      },
    });

    console.log('Company upserted successfully. SNS data saved:', {
      instagramUserId: company.instagramUserId,
      tiktokUserId: company.tiktokUserId,
      youtubeUserId: company.youtubeUserId,
      twitterUserId: company.twitterUserId,
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
