/**
 * API エラートラッキングユーティリティ
 * 様々なタイプのエラーを分類・追跡・報告
 */
export declare enum ErrorCategory {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    NOT_FOUND = "not_found",
    RATE_LIMIT = "rate_limit",
    DATABASE = "database",
    EXTERNAL_API = "external_api",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    SECURITY = "security"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint: string;
    method: string;
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    headers?: Record<string, string>;
    category: ErrorCategory;
    severity: ErrorSeverity;
    metadata?: Record<string, any>;
}
export interface APIError extends Error {
    status?: number;
    code?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
}
/**
 * カスタムAPIエラークラス
 */
export declare class CustomAPIError extends Error implements APIError {
    status: number;
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context: Record<string, any>;
    constructor(message: string, status?: number, code?: string, category?: ErrorCategory, severity?: ErrorSeverity, context?: Record<string, any>);
}
/**
 * バリデーションエラー
 */
export declare class ValidationError extends CustomAPIError {
    constructor(message: string, context?: Record<string, any>);
}
/**
 * 認証エラー
 */
export declare class AuthenticationError extends CustomAPIError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * 認可エラー
 */
export declare class AuthorizationError extends CustomAPIError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * リソース未発見エラー
 */
export declare class NotFoundError extends CustomAPIError {
    constructor(resource?: string, context?: Record<string, any>);
}
/**
 * レート制限エラー
 */
export declare class RateLimitError extends CustomAPIError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * データベースエラー
 */
export declare class DatabaseError extends CustomAPIError {
    constructor(message: string, originalError?: Error, context?: Record<string, any>);
}
/**
 * 外部APIエラー
 */
export declare class ExternalAPIError extends CustomAPIError {
    constructor(service: string, statusCode: number, message: string, context?: Record<string, any>);
}
/**
 * ビジネスロジックエラー
 */
export declare class BusinessLogicError extends CustomAPIError {
    constructor(message: string, context?: Record<string, any>);
}
/**
 * セキュリティエラー
 */
export declare class SecurityError extends CustomAPIError {
    constructor(message: string, context?: Record<string, any>);
}
/**
 * エラーの統合トラッキング
 */
export declare function trackError(error: Error | CustomAPIError, context: ErrorContext): Promise<void>;
/**
 * API応答時間の監視
 */
export declare function trackAPIPerformance(method: string, path: string, statusCode: number, responseTime: number, userId?: string): void;
/**
 * データベースエラーの詳細トラッキング
 */
export declare function trackDatabaseIssue(operation: string, table: string, error: Error, query?: string, params?: any[]): Promise<void>;
/**
 * 外部API呼び出しエラーの追跡
 */
export declare function trackExternalAPIIssue(service: string, endpoint: string, method: string, statusCode: number, responseTime: number, error?: Error): Promise<void>;
/**
 * ビジネスロジックエラーの追跡
 */
export declare function trackBusinessIssue(operation: string, error: Error, context?: Record<string, any>): Promise<void>;
declare const _default: {
    ErrorCategory: typeof ErrorCategory;
    ErrorSeverity: typeof ErrorSeverity;
    CustomAPIError: typeof CustomAPIError;
    ValidationError: typeof ValidationError;
    AuthenticationError: typeof AuthenticationError;
    AuthorizationError: typeof AuthorizationError;
    NotFoundError: typeof NotFoundError;
    RateLimitError: typeof RateLimitError;
    DatabaseError: typeof DatabaseError;
    ExternalAPIError: typeof ExternalAPIError;
    BusinessLogicError: typeof BusinessLogicError;
    SecurityError: typeof SecurityError;
    trackError: typeof trackError;
    trackAPIPerformance: typeof trackAPIPerformance;
    trackDatabaseIssue: typeof trackDatabaseIssue;
    trackExternalAPIIssue: typeof trackExternalAPIIssue;
    trackBusinessIssue: typeof trackBusinessIssue;
};
export default _default;
//# sourceMappingURL=api-error-tracker.d.ts.map