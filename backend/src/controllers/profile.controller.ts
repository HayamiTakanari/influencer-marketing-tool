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