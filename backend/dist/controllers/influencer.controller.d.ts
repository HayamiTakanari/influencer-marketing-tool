import { Request, Response } from 'express';
export declare const searchInfluencers: (req: Request, res: Response) => Promise<void>;
export declare const getInfluencerById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInfluencerStats: (req: Request, res: Response) => Promise<void>;
export declare const getCategories: (req: Request, res: Response) => Promise<void>;
export declare const getPrefectures: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=influencer.controller.d.ts.map