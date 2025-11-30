import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Get TikTok video information
 * POST /api/tiktok/video-info
 * Body: { videoUrl: string }
 */
export declare const getVideoInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get user info from TikTok video
 * POST /api/tiktok/user-info
 * Body: { videoUrl: string }
 */
export declare const getUserInfoFromVideo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Verify TikTok account and save it to profile
 * POST /api/tiktok/verify-account
 * Body: { videoUrl: string, displayName?: string } OR { username: string, displayName?: string }
 */
export declare const verifyAndAddAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get TikTok account stats
 * GET /api/tiktok/account/:socialAccountId/stats
 */
export declare const getAccountStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Sync TikTok account data
 * POST /api/tiktok/sync/:socialAccountId
 */
export declare const syncAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Delete TikTok account from profile
 * DELETE /api/tiktok/account/:socialAccountId
 */
export declare const deleteAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get TikTok user information by username
 * GET /api/tiktok/user/:username
 */
export declare const getUserInfo: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get TikTok user videos statistics
 * GET /api/tiktok/user/:username/videos-stats
 */
export declare const getUserVideosStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get TikTok user follower information
 * GET /api/tiktok/user/:username/followers
 */
export declare const getUserFollowers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Search TikTok videos by keyword
 * GET /api/tiktok/search
 * Query params: keyword, maxResults
 */
export declare const searchVideos: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=tiktok.controller.d.ts.map