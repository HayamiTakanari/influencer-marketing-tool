/**
 * 統一的な API レスポンス形式
 * 本番環境での一貫性を保つため、すべてのエンドポイントでこれを使用する
 */
import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message?: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    requestId?: string;
}
/**
 * 成功レスポンス
 */
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, requestId?: string) => void;
/**
 * エラーレスポンス
 */
export declare const sendError: (res: Response, statusCode: number, code: string, message: string, details?: any, requestId?: string) => void;
/**
 * 認証エラー (401)
 */
export declare const sendUnauthorized: (res: Response, message?: string, requestId?: string) => void;
/**
 * 権限エラー (403)
 */
export declare const sendForbidden: (res: Response, message?: string, requestId?: string) => void;
/**
 * リソース見つからず (404)
 */
export declare const sendNotFound: (res: Response, message?: string, requestId?: string) => void;
/**
 * バリデーションエラー (400)
 */
export declare const sendValidationError: (res: Response, message: string, details?: any, requestId?: string) => void;
/**
 * サーバーエラー (500)
 */
export declare const sendInternalError: (res: Response, message?: string, details?: any, requestId?: string) => void;
/**
 * 既に存在する (409)
 */
export declare const sendConflict: (res: Response, message?: string, requestId?: string) => void;
/**
 * 不正なリクエスト (400)
 */
export declare const sendBadRequest: (res: Response, message?: string, details?: any, requestId?: string) => void;
//# sourceMappingURL=api-response.d.ts.map