import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Chapter 1-7: ポートフォリオアイテムを作成
 */
export declare const createPortfolio: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-7: ポートフォリオアイテムを更新
 */
export declare const updatePortfolio: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Chapter 1-7: ポートフォリオアイテムを削除
 */
export declare const deletePortfolio: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Chapter 1-7: インフルエンサーのポートフォリオ一覧を取得
 */
export declare const getPortfolios: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-7: 単一のポートフォリオアイテムを取得
 */
export declare const getPortfolio: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-7: ポートフォリオ統計を取得
 */
export declare const getStats: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=portfolio.controller.d.ts.map