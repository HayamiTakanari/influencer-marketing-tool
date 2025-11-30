import { Request, Response } from 'express';
export declare const sendScoutInvitation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const acceptScout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectScout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyScoutInvitations: (req: Request, res: Response) => Promise<void>;
export declare const getMySentScouts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getScoutDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=scout.controller.d.ts.map