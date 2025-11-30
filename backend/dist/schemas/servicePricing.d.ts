import { z } from 'zod';
export declare const servicePricingSchema: z.ZodObject<{
    serviceType: z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>;
    price: z.ZodNumber;
    unit: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createServicePricingSchema: z.ZodObject<{
    serviceType: z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>;
    price: z.ZodNumber;
    unit: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateServicePricingSchema: z.ZodObject<{
    serviceType: z.ZodOptional<z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>>;
    price: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const bulkServicePricingSchema: z.ZodArray<z.ZodObject<{
    serviceType: z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>;
    price: z.ZodNumber;
    unit: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>>;
export type CreateServicePricingInput = z.infer<typeof createServicePricingSchema>;
export type UpdateServicePricingInput = z.infer<typeof updateServicePricingSchema>;
export type BulkServicePricingInput = z.infer<typeof bulkServicePricingSchema>;
//# sourceMappingURL=servicePricing.d.ts.map