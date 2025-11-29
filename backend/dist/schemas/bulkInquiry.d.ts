import { z } from 'zod';
export declare const bulkInquirySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    budget: z.ZodOptional<z.ZodNumber>;
    deadline: z.ZodOptional<z.ZodString>;
    requiredServices: z.ZodArray<z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>>;
    targetInfluencers: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const inquiryResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PENDING: "PENDING";
        ACCEPTED: "ACCEPTED";
        DECLINED: "DECLINED";
    }>;
    proposedPrice: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
    availableFrom: z.ZodOptional<z.ZodString>;
    availableTo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createBulkInquirySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    budget: z.ZodOptional<z.ZodNumber>;
    deadline: z.ZodOptional<z.ZodString>;
    requiredServices: z.ZodArray<z.ZodEnum<{
        PHOTOGRAPHY: "PHOTOGRAPHY";
        VIDEO_EDITING: "VIDEO_EDITING";
        CONTENT_CREATION: "CONTENT_CREATION";
        POSTING: "POSTING";
        STORY_CREATION: "STORY_CREATION";
        CONSULTATION: "CONSULTATION";
        LIVE_STREAMING: "LIVE_STREAMING";
        EVENT_APPEARANCE: "EVENT_APPEARANCE";
    }>>;
    targetInfluencers: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const updateInquiryResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PENDING: "PENDING";
        ACCEPTED: "ACCEPTED";
        DECLINED: "DECLINED";
    }>;
    proposedPrice: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
    availableFrom: z.ZodOptional<z.ZodString>;
    availableTo: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateBulkInquiryInput = z.infer<typeof createBulkInquirySchema>;
export type UpdateInquiryResponseInput = z.infer<typeof updateInquiryResponseSchema>;
//# sourceMappingURL=bulkInquiry.d.ts.map