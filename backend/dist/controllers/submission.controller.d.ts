import { Request, Response } from 'express';
export declare const createSubmission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProjectSubmissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInfluencerSubmissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveSubmission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestRevision: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectSubmission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=submission.controller.d.ts.map