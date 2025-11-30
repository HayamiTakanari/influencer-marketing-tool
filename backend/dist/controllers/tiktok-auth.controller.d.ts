import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Chapter 1-6: TikTok アカウント認証
 * ユーザーが入力した TikTok ユーザーID を検証して認証
 */
export declare const authenticateTikTokAccount: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-6: TikTok アカウント状態確認
 */
export declare const getTikTokStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-6: TikTok アカウント認証を削除
 */
export declare const removeTikTok: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Chapter 1-6: TikTok ユーザー情報を直接取得（テスト用）
 */
export declare const getTikTokUserData: (req: Request, res: Response) => Promise<void>;
/**
 * 管理者用: TikTok フォロワー数を一括更新
 */
export declare const updateAllTikTokFollowerCounts: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=tiktok-auth.controller.d.ts.map