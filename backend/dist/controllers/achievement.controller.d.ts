import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createAchievement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyAchievements: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAchievementsByInfluencer: (req: Request, res: Response) => Promise<void>;
export declare const updateAchievement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAchievement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAchievementStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=achievement.controller.d.ts.map