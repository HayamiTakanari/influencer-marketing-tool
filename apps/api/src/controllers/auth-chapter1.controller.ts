import { Request, Response } from 'express';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendEmailVerification, verifyEmailToken, resendEmailVerification } from '../services/email-verification.service';
import { z } from 'zod';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

/**
 * Chapter 1-1: ユーザー登録（企業・インフルエンサー共通）
 * メール認証トークン付きで登録を完了
 */
export const registerWithEmailVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, role, companyName, displayName, legalNumber, representativeName, industry } = req.body;

    // バリデーション
    if (!email || !password || !role) {
      res.status(400).json({ error: 'Email, password, and role are required' });
      return;
    }

    if (role !== 'COMPANY' && role !== 'INFLUENCER') {
      res.status(400).json({ error: 'Invalid role. Must be COMPANY or INFLUENCER' });
      return;
    }

    // パスワード強度チェック（本番環境）
    if (process.env.NODE_ENV === 'production') {
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        res.status(400).json({ error: 'Password must contain uppercase, lowercase, and numbers' });
        return;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 既存ユーザーをチェック
      const existingUser = await tx.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // パスワードをハッシュ化
      const hashedPassword = await hashPassword(password);

      // ユーザーを作成（仮登録状態）
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: role as UserRole,
          status: 'PROVISIONAL', // 仮登録状態
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // ロール別プロフィールを作成
      if (role === 'COMPANY') {
        if (!companyName) {
          throw new Error('Company name is required for COMPANY role');
        }

        await tx.company.create({
          data: {
            userId: user.id,
            companyName: companyName.trim(),
            legalNumber: legalNumber?.trim(),
            representativeName: representativeName?.trim(),
            industry: industry?.trim(),
            status: 'PROVISIONAL',
          },
        });
      } else if (role === 'INFLUENCER') {
        if (!displayName) {
          throw new Error('Display name is required for INFLUENCER role');
        }

        await tx.influencer.create({
          data: {
            userId: user.id,
            displayName: displayName.trim(),
            isRegistered: false,
          },
        });
      }

      return user;
    });

    // メール認証トークンを送信
    try {
      await sendEmailVerification(result.id, result.email);
    } catch (error) {
      console.error('Failed to send verification email, but user was created:', error);
      // ユーザーは作成されたが、メール送信に失敗した場合は200で返却
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email address.',
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        status: 'PROVISIONAL',
      },
      nextStep: 'Email verification',
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    if (error instanceof Error && error.message.includes('required')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Chapter 1-1: メール認証の確認
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const result = await verifyEmailToken(token);

    res.json({
      message: 'Email verified successfully',
      userId: result.userId,
      email: result.email,
      status: 'VERIFICATION_PENDING',
      nextStep: 'Submit identity verification documents',
    });
  } catch (error) {
    console.error('Email verification error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('already')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Chapter 1-1: メール認証トークン再発行
 */
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      // セキュリティのため、ユーザー不存在でも同じメッセージを返す
      res.status(200).json({
        message: 'If an account exists with this email, a verification email has been sent',
      });
      return;
    }

    if (user.emailVerifiedAt) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    await resendEmailVerification(user.id);

    res.json({
      message: 'Verification email has been resent',
      email,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Chapter 1: 登録進捗状況の確認
 */
export const getRegistrationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // ロール別の詳細情報を取得
    let profileInfo = {};
    let documentsInfo = {};

    if (user.role === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId },
        select: {
          id: true,
          isVerified: true,
          verificationDocuments: {
            select: { id: true, documentType: true, status: true },
          },
        },
      });
      profileInfo = company || {};
      documentsInfo = company?.verificationDocuments || [];
    } else if (user.role === 'INFLUENCER') {
      const influencer = await prisma.influencer.findUnique({
        where: { userId },
        select: {
          id: true,
          displayName: true,
          socialAccounts: {
            select: { platform: true, isVerified: true },
          },
          verificationDocuments: {
            select: { id: true, documentType: true, status: true },
          },
        },
      });
      profileInfo = influencer || {};
      documentsInfo = influencer?.verificationDocuments || [];
    }

    // 完了状況を判定
    const emailVerified = !!user.emailVerifiedAt;
    const documentsApproved = Array.isArray(documentsInfo) &&
      (documentsInfo as any[]).every((doc: any) => doc.status === 'APPROVED');
    const isFullyVerified = emailVerified && documentsApproved && user.status === 'VERIFIED';

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      progress: {
        emailVerified,
        documentsApproved,
        fullyVerified: isFullyVerified,
        completionPercentage: emailVerified && documentsApproved ? 100 : emailVerified ? 50 : 0,
      },
      profile: profileInfo,
      documents: documentsInfo,
      nextSteps: isFullyVerified
        ? ['Account fully verified - Ready to use platform']
        : !emailVerified
        ? ['Verify email address']
        : ['Submit identity verification documents'],
    });
  } catch (error) {
    console.error('Error getting registration status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: string };
    }
  }
}
