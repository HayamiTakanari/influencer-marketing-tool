import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkCreateServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getServicePricingByInfluencer: (req: Request, res: Response) => Promise<void>;
export declare const updateServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const validateServicePricing: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=servicePricing.controller.d.ts.map