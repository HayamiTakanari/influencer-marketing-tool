import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
export declare const syncSocialAccount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const syncAllMyAccounts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSyncStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const syncAllInfluencers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=sns.controller.d.ts.map