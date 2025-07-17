import { z } from 'zod';

// v3.0 新機能: 料金体系のスキーマ定義

export const servicePricingSchema = z.object({
  serviceType: z.enum([
    'PHOTOGRAPHY',
    'VIDEO_EDITING', 
    'CONTENT_CREATION',
    'POSTING',
    'STORY_CREATION',
    'CONSULTATION',
    'LIVE_STREAMING',
    'EVENT_APPEARANCE'
  ], {
    required_error: 'サービスタイプを選択してください',
  }),
  price: z.number().min(1, '料金は1円以上で設定してください'),
  unit: z.string().default('per_post'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createServicePricingSchema = servicePricingSchema;
export const updateServicePricingSchema = servicePricingSchema.partial();

export const bulkServicePricingSchema = z.array(servicePricingSchema).min(1, '少なくとも1つのサービス料金を設定してください');

export type CreateServicePricingInput = z.infer<typeof createServicePricingSchema>;
export type UpdateServicePricingInput = z.infer<typeof updateServicePricingSchema>;
export type BulkServicePricingInput = z.infer<typeof bulkServicePricingSchema>;