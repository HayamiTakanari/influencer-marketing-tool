import { Request, Response, NextFunction } from 'express';
/**
 * エラートラッキングミドルウェア
 * Expressアプリケーション全体でのエラー監視
 */
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        isVerified: boolean;
    };
}
/**
 * リクエスト処理時間の測定とトラッキング
 */
export declare function requestTrackingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * ユーザーコンテキストの設定ミドルウェア
 */
export declare function userContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * APIエラーハンドリングミドルウェア
 */
export declare function apiErrorHandler(error: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * 未処理の例外をキャッチするグローバルハンドラー
 */
export declare function setupGlobalErrorHandlers(): void;
/**
 * データベースエラーのトラッキング
 */
export declare function trackDatabaseError(operation: string, table: string, error: Error, query?: string): void;
/**
 * 外部API呼び出しエラーのトラッキング
 */
export declare function trackExternalAPIError(service: string, endpoint: string, statusCode: number, error: Error): void;
/**
 * ビジネスロジックエラーのトラッキング
 */
export declare function trackBusinessLogicError(operation: string, error: Error, context?: Record<string, any>): void;
declare const _default: {
    requestTrackingMiddleware: typeof requestTrackingMiddleware;
    userContextMiddleware: typeof userContextMiddleware;
    apiErrorHandler: typeof apiErrorHandler;
    setupGlobalErrorHandlers: typeof setupGlobalErrorHandlers;
    trackDatabaseError: typeof trackDatabaseError;
    trackExternalAPIError: typeof trackExternalAPIError;
    trackBusinessLogicError: typeof trackBusinessLogicError;
};
export default _default;
//# sourceMappingURL=error-tracking.d.ts.map