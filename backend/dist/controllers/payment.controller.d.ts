import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const createPaymentIntent: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const confirmPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const refundPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const handleStripeWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=payment.controller.d.ts.map