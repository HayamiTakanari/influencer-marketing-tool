import { Request, Response } from 'express';
/**
 * Chapter 1-1: ユーザー登録（企業・インフルエンサー共通）
 * メール認証トークン付きで登録を完了
 */
export declare const registerWithEmailVerification: (req: Request, res: Response) => Promise<void>;
/**
 * Chapter 1-1: メール認証の確認
 */
export declare const verifyEmail: (req: Request, res: Response) => Promise<void>;
/**
 * Chapter 1-1: メール認証トークン再発行
 */
export declare const resendVerificationEmail: (req: Request, res: Response) => Promise<void>;
/**
 * Chapter 1: 登録進捗状況の確認
 */
export declare const getRegistrationStatus: (req: Request, res: Response) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}
//# sourceMappingURL=auth-chapter1.controller.d.ts.map