import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * Get Instagram user information by username
 * GET /api/instagram/user/:username
 */
export declare const getUserInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get Instagram user statistics
 * GET /api/instagram/user/:username/stats
 */
export declare const getUserStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Verify Instagram account and save it to profile
 * POST /api/instagram/verify-account
 * Body: { username: string, displayName?: string }
 */
export declare const verifyAndAddAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=instagram.controller.d.ts.map