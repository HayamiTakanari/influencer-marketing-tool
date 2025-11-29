import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
export declare const getMyProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addSocialAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSocialAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSocialAccount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addPortfolio: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePortfolio: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePortfolio: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadPortfolioImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const completeRegistration: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProfileCompletion: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=profile.controller.d.ts.map