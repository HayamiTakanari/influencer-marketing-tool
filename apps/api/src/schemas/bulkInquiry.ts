import { z } from 'zod';

// v3.0 新機能: 一斉問い合わせのスキーマ定義

export const bulkInquirySchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().min(1, '説明は必須です'),
  budget: z.number().min(0).optional(),
  deadline: z.string().datetime().optional(),
  requiredServices: z.array(z.enum([
    'PHOTOGRAPHY',
    'VIDEO_EDITING',
    'CONTENT_CREATION', 
    'POSTING',
    'STORY_CREATION',
    'CONSULTATION',
    'LIVE_STREAMING',
    'EVENT_APPEARANCE'
  ])).min(1, '必要なサービスを選択してください'),
  targetInfluencers: z.array(z.string().cuid()).min(1, '問い合わせ対象のインフルエンサーを選択してください'),
});

export const inquiryResponseSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED'], 'ステータスを選択してください'),
  proposedPrice: z.number().min(0).optional(),
  message: z.string().optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional(),
});

export const createBulkInquirySchema = bulkInquirySchema;
export const updateInquiryResponseSchema = inquiryResponseSchema;

export type CreateBulkInquiryInput = z.infer<typeof createBulkInquirySchema>;
export type UpdateInquiryResponseInput = z.infer<typeof updateInquiryResponseSchema>;