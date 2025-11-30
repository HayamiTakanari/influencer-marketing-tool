import { Request, Response } from 'express';
export declare const createContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectContract: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyContracts: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=contract.controller.d.ts.map