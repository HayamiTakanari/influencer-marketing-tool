import { z } from 'zod';
export declare const achievementSchema: z.ZodObject<{
    projectName: z.ZodString;
    brandName: z.ZodString;
    purpose: z.ZodEnum<{
        SALES: "SALES";
        LEAD_GEN: "LEAD_GEN";
        AWARENESS: "AWARENESS";
        BRAND_IMAGE: "BRAND_IMAGE";
        ENGAGEMENT: "ENGAGEMENT";
    }>;
    platform: z.ZodEnum<{
        INSTAGRAM: "INSTAGRAM";
        YOUTUBE: "YOUTUBE";
        TIKTOK: "TIKTOK";
        TWITTER: "TWITTER";
    }>;
    description: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        views: z.ZodOptional<z.ZodNumber>;
        likes: z.ZodOptional<z.ZodNumber>;
        shares: z.ZodOptional<z.ZodNumber>;
        comments: z.ZodOptional<z.ZodNumber>;
        conversions: z.ZodOptional<z.ZodNumber>;
        reach: z.ZodOptional<z.ZodNumber>;
        impressions: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    budget: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createAchievementSchema: z.ZodObject<{
    projectName: z.ZodString;
    brandName: z.ZodString;
    purpose: z.ZodEnum<{
        SALES: "SALES";
        LEAD_GEN: "LEAD_GEN";
        AWARENESS: "AWARENESS";
        BRAND_IMAGE: "BRAND_IMAGE";
        ENGAGEMENT: "ENGAGEMENT";
    }>;
    platform: z.ZodEnum<{
        INSTAGRAM: "INSTAGRAM";
        YOUTUBE: "YOUTUBE";
        TIKTOK: "TIKTOK";
        TWITTER: "TWITTER";
    }>;
    description: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        views: z.ZodOptional<z.ZodNumber>;
        likes: z.ZodOptional<z.ZodNumber>;
        shares: z.ZodOptional<z.ZodNumber>;
        comments: z.ZodOptional<z.ZodNumber>;
        conversions: z.ZodOptional<z.ZodNumber>;
        reach: z.ZodOptional<z.ZodNumber>;
        impressions: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    budget: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    link: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateAchievementSchema: z.ZodObject<{
    projectName: z.ZodOptional<z.ZodString>;
    brandName: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodEnum<{
        SALES: "SALES";
        LEAD_GEN: "LEAD_GEN";
        AWARENESS: "AWARENESS";
        BRAND_IMAGE: "BRAND_IMAGE";
        ENGAGEMENT: "ENGAGEMENT";
    }>>;
    platform: z.ZodOptional<z.ZodEnum<{
        INSTAGRAM: "INSTAGRAM";
        YOUTUBE: "YOUTUBE";
        TIKTOK: "TIKTOK";
        TWITTER: "TWITTER";
    }>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metrics: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        views: z.ZodOptional<z.ZodNumber>;
        likes: z.ZodOptional<z.ZodNumber>;
        shares: z.ZodOptional<z.ZodNumber>;
        comments: z.ZodOptional<z.ZodNumber>;
        conversions: z.ZodOptional<z.ZodNumber>;
        reach: z.ZodOptional<z.ZodNumber>;
        impressions: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    budget: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    duration: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    link: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
//# sourceMappingURL=achievements.d.ts.map