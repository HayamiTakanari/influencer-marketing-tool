import { Request, Response } from 'express';
import { PrismaClient, Gender, Platform } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthDate: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  categories: z.array(z.string()).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
});

const socialAccountSchema = z.object({
  platform: z.nativeEnum(Platform),
  username: z.string().min(1),
  profileUrl: z.string().url(),
});

const portfolioSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  link: z.string().url().optional(),
  platform: z.nativeEnum(Platform).optional(),
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            isVerified: true,
          },
        },
        socialAccounts: true,
        portfolio: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(influencer);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const data = updateProfileSchema.parse(req.body);

    const influencer = await prisma.influencer.update({
      where: { userId },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        lastUpdated: new Date(),
      },
      include: {
        socialAccounts: true,
        portfolio: true,
      },
    });

    res.json(influencer);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const addSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const data = socialAccountSchema.parse(req.body);

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const socialAccount = await prisma.socialAccount.create({
      data: {
        ...data,
        influencerId: influencer.id,
      },
    });

    res.json(socialAccount);
  } catch (error) {
    console.error('Add social account error:', error);
    res.status(500).json({ error: 'Failed to add social account' });
  }
};

export const updateSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const data = socialAccountSchema.parse(req.body);

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const socialAccount = await prisma.socialAccount.update({
      where: {
        id,
        influencerId: influencer.id,
      },
      data,
    });

    res.json(socialAccount);
  } catch (error) {
    console.error('Update social account error:', error);
    res.status(500).json({ error: 'Failed to update social account' });
  }
};

export const deleteSocialAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await prisma.socialAccount.delete({
      where: {
        id,
        influencerId: influencer.id,
      },
    });

    res.json({ message: 'Social account deleted successfully' });
  } catch (error) {
    console.error('Delete social account error:', error);
    res.status(500).json({ error: 'Failed to delete social account' });
  }
};

export const addPortfolio = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const data = portfolioSchema.parse(req.body);

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        ...data,
        influencerId: influencer.id,
      },
    });

    res.json(portfolio);
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ error: 'Failed to add portfolio' });
  }
};

export const updatePortfolio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const data = portfolioSchema.parse(req.body);

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const portfolio = await prisma.portfolio.update({
      where: {
        id,
        influencerId: influencer.id,
      },
      data,
    });

    res.json(portfolio);
  } catch (error) {
    console.error('Update portfolio error:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
};

export const deletePortfolio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    await prisma.portfolio.delete({
      where: {
        id,
        influencerId: influencer.id,
      },
    });

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ error: 'Failed to delete portfolio' });
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadPortfolioImage = [
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { portfolioId } = req.params;
      const userId = req.user?.id;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const influencer = await prisma.influencer.findUnique({
        where: { userId },
      });

      if (!influencer) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          influencerId: influencer.id,
        },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'portfolio',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      const updatedPortfolio = await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { imageUrl: result.secure_url },
      });

      res.json(updatedPortfolio);
    } catch (error) {
      console.error('Upload portfolio image error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },
];

export const completeRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        socialAccounts: true,
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Validate required fields
    if (
      !influencer.displayName ||
      !influencer.categories ||
      influencer.categories.length === 0 ||
      influencer.socialAccounts.length === 0
    ) {
      return res.status(400).json({
        error: 'Please complete all required fields before registration',
      });
    }

    const updatedInfluencer = await prisma.influencer.update({
      where: { id: influencer.id },
      data: { isRegistered: true },
    });

    res.json(updatedInfluencer);
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
};

export const getProfileCompletion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        user: true,
        socialAccounts: true,
        portfolio: true,
        achievements: true,
      },
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    const fields = [
      { name: '表示名', key: 'displayName', value: influencer.displayName, weight: 5 },
      { name: '自己紹介', key: 'bio', value: influencer.bio, weight: 10 },
      { name: '性別', key: 'gender', value: influencer.gender !== 'NOT_SPECIFIED' ? influencer.gender : null, weight: 5 },
      { name: '生年月日', key: 'birthDate', value: influencer.birthDate, weight: 5 },
      { name: '電話番号', key: 'phoneNumber', value: influencer.phoneNumber, weight: 5 },
      { name: '住所', key: 'address', value: influencer.address, weight: 5 },
      { name: '都道府県', key: 'prefecture', value: influencer.prefecture, weight: 5 },
      { name: '市区町村', key: 'city', value: influencer.city, weight: 5 },
      { name: 'カテゴリー', key: 'categories', value: influencer.categories.length > 0 ? influencer.categories : null, weight: 10 },
      { name: '最低単価', key: 'priceMin', value: influencer.priceMin, weight: 5 },
      { name: '最高単価', key: 'priceMax', value: influencer.priceMax, weight: 5 },
      { name: 'SNSアカウント', key: 'socialAccounts', value: influencer.socialAccounts.length > 0 ? influencer.socialAccounts : null, weight: 15 },
      { name: 'ポートフォリオ', key: 'portfolio', value: influencer.portfolio.length > 0 ? influencer.portfolio : null, weight: 10 },
    ];

    const completedFields = fields.filter(field => field.value !== null && field.value !== undefined && field.value !== '');
    const missingFields = fields.filter(field => field.value === null || field.value === undefined || field.value === '');

    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = completedFields.reduce((sum, field) => sum + field.weight, 0);
    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    res.json({
      completionPercentage,
      completedFields: completedFields.map(f => ({ name: f.name, key: f.key })),
      missingFields: missingFields.map(f => ({ name: f.name, key: f.key, weight: f.weight })),
      stats: {
        totalFields: fields.length,
        completedCount: completedFields.length,
        missingCount: missingFields.length,
      }
    });
  } catch (error) {
    console.error('Get profile completion error:', error);
    res.status(500).json({ error: 'Failed to get profile completion' });
  }
};