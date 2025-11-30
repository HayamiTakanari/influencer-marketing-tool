import { Request, Response } from 'express';
export declare const getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const suspendUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const reactivateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProjectReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getModerationQueue: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveContent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAdminDashboard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=admin-management.controller.d.ts.map