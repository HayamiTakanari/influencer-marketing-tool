import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
/**
 * Get YouTube channel information by username/handle
 * GET /api/youtube/channel/:username
 */
export declare const getChannelInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get YouTube channel statistics
 * GET /api/youtube/channel/:username/stats
 */
export declare const getChannelStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Verify YouTube channel and save it to profile
 * POST /api/youtube/verify-account
 * Body: { username: string, displayName?: string }
 */
export declare const verifyAndAddAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=youtube.controller.d.ts.map