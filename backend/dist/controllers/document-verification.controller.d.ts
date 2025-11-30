import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
    file?: Express.Multer.File;
}
/**
 * Chapter 1-2: 本人確認書類のアップロード
 * 企業：登記簿謄本、インフルエンサー：身分証明書
 */
export declare const uploadDocument: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-2: 本人確認書類の状態確認
 */
export declare const getDocumentStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-2: 本人確認書類の承認（管理者機能）
 */
export declare const approveDocument: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-2: 本人確認書類の却下・再提出要求（管理者機能）
 */
export declare const rejectDocument: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=document-verification.controller.d.ts.map