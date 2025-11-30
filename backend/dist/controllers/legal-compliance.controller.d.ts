import { Request, Response } from 'express';
export declare const getLegalDocuments: (req: Request, res: Response) => Promise<void>;
export declare const getLegalDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptLegalDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserConsentStatus: (req: Request, res: Response) => Promise<void>;
export declare const getComplianceReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLegalDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=legal-compliance.controller.d.ts.map