"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAchievementSchema = exports.createAchievementSchema = exports.achievementSchema = void 0;
const zod_1 = require("zod");
// v3.0 新機能: 実績管理のスキーマ定義
exports.achievementSchema = zod_1.z.object({
    projectName: zod_1.z.string().min(1, 'プロジェクト名は必須です'),
    brandName: zod_1.z.string().min(1, 'ブランド名は必須です'),
    purpose: zod_1.z.enum(['SALES', 'LEAD_GEN', 'AWARENESS', 'BRAND_IMAGE', 'ENGAGEMENT'], '目的を選択してください'),
    platform: zod_1.z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'], 'プラットフォームを選択してください'),
    description: zod_1.z.string().optional(),
    metrics: zod_1.z.object({
        views: zod_1.z.number().min(0).optional(),
        likes: zod_1.z.number().min(0).optional(),
        shares: zod_1.z.number().min(0).optional(),
        comments: zod_1.z.number().min(0).optional(),
        conversions: zod_1.z.number().min(0).optional(),
        reach: zod_1.z.number().min(0).optional(),
        impressions: zod_1.z.number().min(0).optional(),
    }).optional(),
    budget: zod_1.z.number().min(0).optional(),
    duration: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    link: zod_1.z.string().url().optional(),
});
exports.createAchievementSchema = exports.achievementSchema;
exports.updateAchievementSchema = exports.achievementSchema.partial();
