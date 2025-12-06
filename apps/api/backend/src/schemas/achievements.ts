import { z } from 'zod';

// v3.0 新機能: 実績管理のスキーマ定義

export const achievementSchema = z.object({
  projectName: z.string().min(1, 'プロジェクト名は必須です'),
  brandName: z.string().min(1, 'ブランド名は必須です'),
  purpose: z.enum(['SALES', 'LEAD_GEN', 'AWARENESS', 'BRAND_IMAGE', 'ENGAGEMENT'], '目的を選択してください'),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'], 'プラットフォームを選択してください'),
  description: z.string().optional(),
  metrics: z.object({
    views: z.number().min(0).optional(),
    likes: z.number().min(0).optional(),
    shares: z.number().min(0).optional(),
    comments: z.number().min(0).optional(),
    conversions: z.number().min(0).optional(),
    reach: z.number().min(0).optional(),
    impressions: z.number().min(0).optional(),
  }).optional(),
  budget: z.number().min(0).optional(),
  duration: z.string().optional(),
  imageUrl: z.string().url().optional(),
  link: z.string().url().optional(),
});

export const createAchievementSchema = achievementSchema;
export const updateAchievementSchema = achievementSchema.partial();

export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;