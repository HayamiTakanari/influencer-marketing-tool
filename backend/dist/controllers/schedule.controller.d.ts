import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createProjectSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProjectSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMilestone: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUpcomingMilestones: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendMilestoneNotifications: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=schedule.controller.d.ts.map