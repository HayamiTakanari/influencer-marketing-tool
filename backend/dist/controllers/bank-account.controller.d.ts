import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Chapter 1-9: インフルエンサーの口座情報を保存
 */
export declare const saveBankAccountInfo: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-9: インフルエンサーの口座情報を取得
 */
export declare const getBankAccountInfo: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-9: インフルエンサーの口座情報を削除
 */
export declare const deleteBankAccountInfo: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-10: インボイス情報を保存
 */
export declare const saveInvoiceRegistration: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-10: インボイス情報を取得
 */
export declare const getInvoiceRegistration: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-10: インボイス情報を削除
 */
export declare const deleteInvoiceRegistration: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-9: 企業の口座情報を保存
 */
export declare const saveCompanyBankAccountInfo: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-9: 企業の口座情報を取得
 */
export declare const getCompanyBankAccountInfo: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=bank-account.controller.d.ts.map