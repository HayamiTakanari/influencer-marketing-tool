import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
export declare const createRateLimit: (options: {
    windowMs: number;
    max: number;
    message: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const upload: multer.Multer;
export declare const checkDatabasePermissions: (requiredRole?: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkDatabaseQuota: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQueryParameters: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.d.ts.map