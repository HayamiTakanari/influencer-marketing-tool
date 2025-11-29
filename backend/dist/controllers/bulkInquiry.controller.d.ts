import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createBulkInquiry: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyBulkInquiries: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyInquiryResponses: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInquiryResponse: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBulkInquiryById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInquiryStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=bulkInquiry.controller.d.ts.map