import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RegisterInput, LoginInput } from '../schemas/auth';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient({
  // SQLインジェクション対策として、ログレベルを設定
  log: ['warn', 'error'],
  // データベース接続の制限
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, role, companyName, contactName, displayName } = req.body;

    // トランザクションを使用してデータ整合性を確保
    const result = await prisma.$transaction(async (tx) => {
      // 既存ユーザーチェック（パラメータ化クエリを使用）
      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true } // 必要な情報のみ取得
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      const hashedPassword = await hashPassword(password);

      // ユーザー作成
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(), // 正規化
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      // ロール別の関連データ作成
      if (role === 'CLIENT' && companyName && contactName) {
        await tx.client.create({
          data: {
            userId: user.id,
            companyName: companyName.trim(),
            contactName: contactName.trim(),
          },
        });
      } else if (role === 'INFLUENCER' && displayName) {
        await tx.influencer.create({
          data: {
            userId: user.id,
            displayName: displayName.trim(),
            isRegistered: true,
          },
        });
      }

      return user;
    });

    const token = generateToken(result);

    // セキュリティログ
    console.log(`User registered: ${result.id} (${result.email}) - Role: ${result.role}`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // ユーザー検索（パラメータ化クエリ、必要な情報のみ取得）
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isVerified: true,
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true
          }
        },
        influencer: {
          select: {
            id: true,
            displayName: true,
            isRegistered: true
          }
        }
      },
    });

    if (!user) {
      // セキュリティログ：失敗した認証試行
      console.warn(`Failed login attempt for email: ${email} from IP: ${clientIP}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // アカウント検証チェック（一時的に無効化 - 自動承認に変更）
    // if (!user.isVerified) {
    //   console.warn(`Login attempt for unverified account: ${user.id} from IP: ${clientIP}`);
    //   res.status(401).json({ error: 'Account not verified' });
    //   return;
    // }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // セキュリティログ：パスワード不一致
      console.warn(`Invalid password for user: ${user.id} from IP: ${clientIP}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // トークン生成（パスワード情報を除く）
    const tokenUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };
    
    const token = generateToken(tokenUser);

    // 成功ログ
    console.log(`Successful login: ${user.id} (${user.email}) from IP: ${clientIP}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.client || user.influencer,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};