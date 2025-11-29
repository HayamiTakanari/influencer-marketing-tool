import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<{
        CLIENT: "CLIENT";
        INFLUENCER: "INFLUENCER";
        ADMIN: "ADMIN";
    }>;
    companyName: z.ZodOptional<z.ZodString>;
    contactName: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const userQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        CLIENT: "CLIENT";
        INFLUENCER: "INFLUENCER";
        ADMIN: "ADMIN";
    }>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
//# sourceMappingURL=auth.d.ts.map