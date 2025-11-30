import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Get Twitter user information by username
 * GET /api/twitter/user/:username
 */
export declare const getUserInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get Twitter user statistics
 * GET /api/twitter/user/:username/stats
 */
export declare const getUserStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Verify Twitter account and save it to profile
 * POST /api/twitter/verify-account
 * Body: { username: string, displayName?: string }
 */
export declare const verifyAndAddAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=twitter.controller.d.ts.map