import { Request, Response } from 'express';
export declare const createReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserReviews: (req: Request, res: Response) => Promise<void>;
export declare const getMyReviews: (req: Request, res: Response) => Promise<void>;
export declare const updateReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteReview: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAverageRating: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=review.controller.d.ts.map