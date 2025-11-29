import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCompanies: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInfluencers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjects: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjectDetail: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUserStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUser: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProjectProgress: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=admin.controller.d.ts.map