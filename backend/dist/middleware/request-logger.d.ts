import { Request, Response, NextFunction } from 'express';
/**
 * リクエストログ収集・監視ミドルウェア
 * 全てのHTTPリクエストを詳細に記録し、異常パターン検知の基盤とする
 */
export interface RequestLogData {
    timestamp: Date;
    requestId: string;
    method: string;
    url: string;
    path: string;
    query: Record<string, any>;
    headers: Record<string, string>;
    ipAddress: string;
    userAgent: string;
    referer?: string;
    origin?: string;
    userId?: string;
    sessionId?: string;
    userRole?: string;
    statusCode: number;
    responseTime: number;
    responseSize: number;
    isBot: boolean;
    isSuspicious: boolean;
    geoLocation?: {
        country?: string;
        region?: string;
        city?: string;
    };
    error?: {
        message: string;
        stack?: string;
        type: string;
    };
}
export interface RequestMetrics {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    uniqueIPs: number;
    topEndpoints: Array<{
        endpoint: string;
        count: number;
    }>;
    topUserAgents: Array<{
        userAgent: string;
        count: number;
    }>;
    suspiciousActivity: number;
}
/**
 * リクエストログ収集ミドルウェア
 */
export declare function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * リクエストメトリクス取得ミドルウェア
 */
export declare function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * メトリクス取得API用の関数
 */
export declare function getCurrentMetrics(): RequestMetrics;
declare const _default: {
    requestLoggingMiddleware: typeof requestLoggingMiddleware;
    requestMetricsMiddleware: typeof requestMetricsMiddleware;
    getCurrentMetrics: typeof getCurrentMetrics;
};
export default _default;
//# sourceMappingURL=request-logger.d.ts.map