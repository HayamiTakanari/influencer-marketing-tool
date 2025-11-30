"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkServicePricingSchema = exports.updateServicePricingSchema = exports.createServicePricingSchema = exports.servicePricingSchema = void 0;
const zod_1 = require("zod");
// v3.0 新機能: 料金体系のスキーマ定義
exports.servicePricingSchema = zod_1.z.object({
    serviceType: zod_1.z.enum([
        'PHOTOGRAPHY',
        'VIDEO_EDITING',
        'CONTENT_CREATION',
        'POSTING',
        'STORY_CREATION',
        'CONSULTATION',
        'LIVE_STREAMING',
        'EVENT_APPEARANCE'
    ], 'サービスタイプを選択してください'),
    price: zod_1.z.number().min(1, '料金は1円以上で設定してください'),
    unit: zod_1.z.string().default('per_post'),
    description: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
exports.createServicePricingSchema = exports.servicePricingSchema;
exports.updateServicePricingSchema = exports.servicePricingSchema.partial();
exports.bulkServicePricingSchema = zod_1.z.array(exports.servicePricingSchema).min(1, '少なくとも1つのサービス料金を設定してください');
//# sourceMappingURL=servicePricing.js.map