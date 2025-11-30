import { BankAccount } from '@prisma/client';
/**
 * 銀行口座情報の暗号化・復号化ユーティリティ
 * Chapter 1-9: 口座情報の登録
 */
interface BankAccountData {
    accountHolder: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
}
/**
 * インフルエンサーの銀行口座情報を保存
 */
export declare const saveBankAccount: (influencerId: string, accountData: BankAccountData) => Promise<BankAccount>;
/**
 * インフルエンサーの銀行口座情報を取得
 */
export declare const getBankAccount: (influencerId: string) => Promise<Partial<BankAccount> | null>;
/**
 * 企業の銀行口座情報を保存
 */
export declare const saveCompanyBankAccount: (companyId: string, accountData: BankAccountData) => Promise<BankAccount>;
/**
 * 企業の銀行口座情報を取得
 */
export declare const getCompanyBankAccount: (companyId: string) => Promise<Partial<BankAccount> | null>;
/**
 * 銀行口座情報を削除（セキュリティ理由で履歴は残さない）
 */
export declare const deleteBankAccount: (influencerId: string) => Promise<void>;
/**
 * 銀行口座情報の検証
 */
export declare const validateBankAccount: (accountData: BankAccountData) => string[];
/**
 * インボイス登録番号の検証
 * 形式: T + 13桁の数字
 */
export declare const validateInvoiceNumber: (invoiceNumber: string) => boolean;
/**
 * インフルエンサーのインボイス情報を保存
 */
export declare const saveInvoiceInfo: (influencerId: string, invoiceNumber: string) => Promise<void>;
/**
 * インフルエンサーのインボイス情報を取得
 */
export declare const getInvoiceInfo: (influencerId: string) => Promise<{
    invoiceNumber: string | null;
    registeredAt: Date | null;
}>;
/**
 * インボイス情報を削除
 */
export declare const deleteInvoiceInfo: (influencerId: string) => Promise<void>;
export {};
//# sourceMappingURL=bank-account.service.d.ts.map