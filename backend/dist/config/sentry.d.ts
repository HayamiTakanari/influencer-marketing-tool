import { Express } from 'express';
/**
 * Sentry初期化とExpress統合
 */
export declare function initializeSentry(app: Express): void;
/**
 * エラーハンドラー（最後のミドルウェアとして設定）
 */
export declare function setupSentryErrorHandler(app: Express): void;
/**
 * ユーザーコンテキストの設定
 */
export declare function setSentryUser(user: {
    id: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
}): void;
/**
 * ユーザーコンテキストのクリア
 */
export declare function clearSentryUser(): void;
/**
 * カスタムタグの設定
 */
export declare function setSentryTags(tags: Record<string, string>): void;
/**
 * エラーの手動キャプチャ
 */
export declare function captureError(error: Error | string, context?: {
    user?: any;
    extra?: Record<string, any>;
    tags?: Record<string, string>;
    level?: 'error' | 'warning' | 'info' | 'debug';
}): string;
/**
 * API呼び出しのトラッキング
 */
export declare function trackAPIEndpoint(method: string, path: string, statusCode: number, duration: number, error?: Error): void;
/**
 * データベース操作のトラッキング
 */
export declare function trackDatabaseOperation(operation: string, table: string, duration: number, error?: Error): void;
/**
 * ビジネスロジックのメトリクス
 */
export declare function trackBusinessMetric(metricName: string, value: number, unit?: string, tags?: Record<string, string>): void;
declare const _default: {
    initializeSentry: typeof initializeSentry;
    setupSentryErrorHandler: typeof setupSentryErrorHandler;
    setSentryUser: typeof setSentryUser;
    clearSentryUser: typeof clearSentryUser;
    setSentryTags: typeof setSentryTags;
    captureError: typeof captureError;
    trackAPIEndpoint: typeof trackAPIEndpoint;
    trackDatabaseOperation: typeof trackDatabaseOperation;
    trackBusinessMetric: typeof trackBusinessMetric;
};
export default _default;
//# sourceMappingURL=sentry.d.ts.map