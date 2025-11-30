import { Request, Response } from 'express';
export declare const createInvoice: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPendingInvoices: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInvoice: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAsPaid: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInvoiceSummary: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=invoice.controller.d.ts.map