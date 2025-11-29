"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInquiryResponseSchema = exports.createBulkInquirySchema = exports.inquiryResponseSchema = exports.bulkInquirySchema = void 0;
const zod_1 = require("zod");
// v3.0 新機能: 一斉問い合わせのスキーマ定義
exports.bulkInquirySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'タイトルは必須です'),
    description: zod_1.z.string().min(1, '説明は必須です'),
    budget: zod_1.z.number().min(0).optional(),
    deadline: zod_1.z.string().datetime().optional(),
    requiredServices: zod_1.z.array(zod_1.z.enum([
        'PHOTOGRAPHY',
        'VIDEO_EDITING',
        'CONTENT_CREATION',
        'POSTING',
        'STORY_CREATION',
        'CONSULTATION',
        'LIVE_STREAMING',
        'EVENT_APPEARANCE'
    ])).min(1, '必要なサービスを選択してください'),
    targetInfluencers: zod_1.z.array(zod_1.z.string().cuid()).min(1, '問い合わせ対象のインフルエンサーを選択してください'),
});
exports.inquiryResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'ACCEPTED', 'DECLINED'], 'ステータスを選択してください'),
    proposedPrice: zod_1.z.number().min(0).optional(),
    message: zod_1.z.string().optional(),
    availableFrom: zod_1.z.string().datetime().optional(),
    availableTo: zod_1.z.string().datetime().optional(),
});
exports.createBulkInquirySchema = exports.bulkInquirySchema;
exports.updateInquiryResponseSchema = exports.inquiryResponseSchema;
