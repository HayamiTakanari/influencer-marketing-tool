import { Request, Response } from 'express';
export declare const logSecurityEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSecurityLogs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const detectAnomalies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSuspiciousUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=security-monitoring.controller.d.ts.map