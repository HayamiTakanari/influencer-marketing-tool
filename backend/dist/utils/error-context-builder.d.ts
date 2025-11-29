import { Request } from 'express';
/**
 * エラーコンテキスト構築ユーティリティ
 * ユーザー情報、環境情報、リクエスト情報を統合してSentryに送信
 */
export interface UserInfo {
    id: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
    plan?: string;
    subscriptionId?: string;
    companyId?: string;
    lastLoginAt?: Date;
    createdAt?: Date;
}
export interface DeviceInfo {
    userAgent?: string;
    platform?: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    isMobile?: boolean;
    screenResolution?: string;
    timezone?: string;
    language?: string;
}
export interface SessionInfo {
    sessionId?: string;
    sessionStartTime?: Date;
    sessionDuration?: number;
    pageViews?: number;
    actionsPerformed?: string[];
    referrer?: string;
    entryPage?: string;
    isFirstVisit?: boolean;
}
export interface RequestInfo {
    method: string;
    path: string;
    url: string;
    ipAddress: string;
    headers: Record<string, string>;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    timestamp: Date;
    responseTime?: number;
    statusCode?: number;
}
export interface EnvironmentInfo {
    environment: string;
    version: string;
    buildNumber?: string;
    deploymentId?: string;
    region?: string;
    serverInstance?: string;
    nodeVersion: string;
    dbConnections?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    uptime?: number;
}
export interface BusinessContext {
    feature?: string;
    operation?: string;
    resourceType?: string;
    resourceId?: string;
    workflowStep?: string;
    experimentId?: string;
    experimentVariant?: string;
    featureFlags?: Record<string, boolean>;
}
/**
 * リクエストからユーザー情報を抽出
 */
export declare function extractUserInfo(req: any): UserInfo | undefined;
/**
 * リクエストからデバイス情報を抽出
 */
export declare function extractDeviceInfo(req: Request): DeviceInfo;
/**
 * リクエストからセッション情報を抽出
 */
export declare function extractSessionInfo(req: any): SessionInfo;
/**
 * リクエスト情報を抽出
 */
export declare function extractRequestInfo(req: Request): RequestInfo;
/**
 * 環境情報を取得
 */
export declare function getEnvironmentInfo(): EnvironmentInfo;
/**
 * ビジネスコンテキストを設定
 */
export declare function setBusinessContext(context: BusinessContext): void;
/**
 * 完全なエラーコンテキストを構築
 */
export declare function buildErrorContext(req: Request, additionalContext?: Partial<BusinessContext>): {
    user: UserInfo;
    device: DeviceInfo;
    session: SessionInfo;
    request: RequestInfo;
    environment: EnvironmentInfo;
    business: Partial<BusinessContext>;
};
/**
 * パフォーマンスメトリクスの追跡
 */
export declare function trackPerformanceMetrics(metrics: {
    operation: string;
    duration: number;
    memoryBefore?: NodeJS.MemoryUsage;
    memoryAfter?: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
    customMetrics?: Record<string, number>;
}): void;
declare const _default: {
    extractUserInfo: typeof extractUserInfo;
    extractDeviceInfo: typeof extractDeviceInfo;
    extractSessionInfo: typeof extractSessionInfo;
    extractRequestInfo: typeof extractRequestInfo;
    getEnvironmentInfo: typeof getEnvironmentInfo;
    setBusinessContext: typeof setBusinessContext;
    buildErrorContext: typeof buildErrorContext;
    trackPerformanceMetrics: typeof trackPerformanceMetrics;
};
export default _default;
//# sourceMappingURL=error-context-builder.d.ts.map