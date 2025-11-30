import { z } from 'zod';
export declare const projectScheduleSchema: z.ZodObject<{
    projectId: z.ZodString;
    publishDate: z.ZodString;
    milestones: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            VIDEO_COMPLETION: "VIDEO_COMPLETION";
            FINAL_APPROVAL: "FINAL_APPROVAL";
            PUBLISH_DATE: "PUBLISH_DATE";
        }>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const milestoneSchema: z.ZodObject<{
    type: z.ZodEnum<{
        VIDEO_COMPLETION: "VIDEO_COMPLETION";
        FINAL_APPROVAL: "FINAL_APPROVAL";
        PUBLISH_DATE: "PUBLISH_DATE";
    }>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodString;
}, z.core.$strip>;
export declare const updateMilestoneSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createProjectScheduleSchema: z.ZodObject<{
    projectId: z.ZodString;
    publishDate: z.ZodString;
    milestones: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            VIDEO_COMPLETION: "VIDEO_COMPLETION";
            FINAL_APPROVAL: "FINAL_APPROVAL";
            PUBLISH_DATE: "PUBLISH_DATE";
        }>;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const createMilestoneSchema: z.ZodObject<{
    type: z.ZodEnum<{
        VIDEO_COMPLETION: "VIDEO_COMPLETION";
        FINAL_APPROVAL: "FINAL_APPROVAL";
        PUBLISH_DATE: "PUBLISH_DATE";
    }>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodString;
}, z.core.$strip>;
export declare const updateMilestoneSchemaExport: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type CreateProjectScheduleInput = z.infer<typeof createProjectScheduleSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
//# sourceMappingURL=schedule.d.ts.map