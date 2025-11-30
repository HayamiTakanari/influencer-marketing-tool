/**
 * メール認証トークンを生成し、ユーザーにメールを送信
 * Chapter 1-1: メール認証の送信
 */
export declare const sendEmailVerification: (userId: string, email: string) => Promise<void>;
/**
 * メール認証トークンを検証し、ユーザーをメール認証完了に更新
 * Chapter 1-1: メール認証の確認
 */
export declare const verifyEmailToken: (token: string) => Promise<{
    userId: string;
    email: string;
}>;
/**
 * メール認証トークンを再発行（有効期限切れ対応）
 * Chapter 1-1: メール再認証
 */
export declare const resendEmailVerification: (userId: string) => Promise<void>;
/**
 * メール認証状態をチェック
 */
export declare const getEmailVerificationStatus: (userId: string) => Promise<boolean>;
//# sourceMappingURL=email-verification.service.d.ts.map