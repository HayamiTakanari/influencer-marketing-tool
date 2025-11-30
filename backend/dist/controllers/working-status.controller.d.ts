import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Chapter 1-8: 稼働状況を更新
 */
export declare const updateStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-8: 稼働状況を取得
 */
export declare const getStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * 稼働状況の選択肢と説明を取得
 */
export declare const getStatusOptions: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=working-status.controller.d.ts.map