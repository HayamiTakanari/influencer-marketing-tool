"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.BusinessLogicError = exports.ExternalAPIError = exports.DatabaseError = exports.RateLimitError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.CustomAPIError = exports.ErrorSeverity = exports.ErrorCategory = void 0;
exports.trackError = trackError;
exports.trackAPIPerformance = trackAPIPerformance;
exports.trackDatabaseIssue = trackDatabaseIssue;
exports.trackExternalAPIIssue = trackExternalAPIIssue;
exports.trackBusinessIssue = trackBusinessIssue;
const client_1 = require("@prisma/client");
const sentry_1 = require("../config/sentry");
const error_tracking_1 = require("../middleware/error-tracking");
const prisma = new client_1.PrismaClient();
/**
 * API エラートラッキングユーティリティ
 * 様々なタイプのエラーを分類・追跡・報告
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["NOT_FOUND"] = "not_found";
    ErrorCategory["RATE_LIMIT"] = "rate_limit";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["EXTERNAL_API"] = "external_api";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["SECURITY"] = "security";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * カスタムAPIエラークラス
 */
class CustomAPIError extends Error {
    status;
    code;
    category;
    severity;
    context;
    constructor(message, status = 500, code = 'INTERNAL_ERROR', category = ErrorCategory.SYSTEM, severity = ErrorSeverity.MEDIUM, context = {}) {
        super(message);
        this.name = 'CustomAPIError';
        this.status = status;
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.context = context;
    }
}
exports.CustomAPIError = CustomAPIError;
/**
 * バリデーションエラー
 */
class ValidationError extends CustomAPIError {
    constructor(message, context = {}) {
        super(message, 400, 'VALIDATION_ERROR', ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
    }
}
exports.ValidationError = ValidationError;
/**
 * 認証エラー
 */
class AuthenticationError extends CustomAPIError {
    constructor(message = 'Authentication required', context = {}) {
        super(message, 401, 'AUTHENTICATION_ERROR', ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM, context);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * 認可エラー
 */
class AuthorizationError extends CustomAPIError {
    constructor(message = 'Access denied', context = {}) {
        super(message, 403, 'AUTHORIZATION_ERROR', ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, context);
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * リソース未発見エラー
 */
class NotFoundError extends CustomAPIError {
    constructor(resource = 'Resource', context = {}) {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', ErrorCategory.NOT_FOUND, ErrorSeverity.LOW, context);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * レート制限エラー
 */
class RateLimitError extends CustomAPIError {
    constructor(message = 'Too many requests', context = {}) {
        super(message, 429, 'RATE_LIMIT_ERROR', ErrorCategory.RATE_LIMIT, ErrorSeverity.MEDIUM, context);
    }
}
exports.RateLimitError = RateLimitError;
/**
 * データベースエラー
 */
class DatabaseError extends CustomAPIError {
    constructor(message, originalError, context = {}) {
        super(message, 500, 'DATABASE_ERROR', ErrorCategory.DATABASE, ErrorSeverity.HIGH, { ...context, originalError: originalError?.message });
    }
}
exports.DatabaseError = DatabaseError;
/**
 * 外部APIエラー
 */
class ExternalAPIError extends CustomAPIError {
    constructor(service, statusCode, message, context = {}) {
        super(`External API error from ${service}: ${message}`, 502, 'EXTERNAL_API_ERROR', ErrorCategory.EXTERNAL_API, statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM, { ...context, service, externalStatusCode: statusCode });
    }
}
exports.ExternalAPIError = ExternalAPIError;
/**
 * ビジネスロジックエラー
 */
class BusinessLogicError extends CustomAPIError {
    constructor(message, context = {}) {
        super(message, 422, 'BUSINESS_LOGIC_ERROR', ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, context);
    }
}
exports.BusinessLogicError = BusinessLogicError;
/**
 * セキュリティエラー
 */
class SecurityError extends CustomAPIError {
    constructor(message, context = {}) {
        super(message, 400, 'SECURITY_ERROR', ErrorCategory.SECURITY, ErrorSeverity.HIGH, context);
    }
}
exports.SecurityError = SecurityError;
/**
 * エラーの統合トラッキング
 */
async function trackError(error, context) {
    try {
        const isCustomError = error instanceof CustomAPIError;
        const errorData = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            status: isCustomError ? error.status : 500,
            code: isCustomError ? error.code : 'UNKNOWN_ERROR',
            category: isCustomError ? error.category : ErrorCategory.SYSTEM,
            severity: isCustomError ? error.severity : ErrorSeverity.MEDIUM,
            context: isCustomError ? error.context : {},
            ...context,
            timestamp: new Date().toISOString(),
        };
        // Sentryにエラーを送信
        const sentryErrorId = (0, sentry_1.captureError)(error, {
            user: context.userId ? { id: context.userId } : undefined,
            extra: {
                errorData,
                endpoint: context.endpoint,
                method: context.method,
                params: context.params,
                query: context.query,
                body: sanitizeRequestBody(context.body),
                userAgent: context.userAgent,
                ipAddress: context.ipAddress,
            },
            tags: {
                category: errorData.category,
                severity: errorData.severity,
                endpoint: context.endpoint,
                method: context.method,
                status: errorData.status.toString(),
            },
            level: getSentryLevel(errorData.severity),
        });
        // データベースにエラーログを保存
        await saveErrorToDatabase(errorData, sentryErrorId);
        // 特定のエラータイプに応じた追加処理
        await handleSpecificErrorTypes(error, context);
    }
    catch (trackingError) {
        console.error('Error tracking failed:', trackingError);
        // エラートラッキング自体の失敗はSentryに送信
        (0, sentry_1.captureError)(trackingError, {
            tags: { category: 'error_tracking', issue: 'tracking_failure' },
            level: 'warning'
        });
    }
}
/**
 * API応答時間の監視
 */
function trackAPIPerformance(method, path, statusCode, responseTime, userId) {
    // 正常なレスポンスの場合
    (0, sentry_1.trackAPIEndpoint)(method, path, statusCode, responseTime);
    // 遅いAPIの警告
    if (responseTime > 3000) { // 3秒以上
        (0, sentry_1.captureError)(`Slow API response: ${method} ${path}`, {
            extra: {
                responseTime,
                statusCode,
                userId,
            },
            tags: {
                category: 'performance',
                issue: 'slow_api',
                method,
                path,
            },
            level: 'warning'
        });
    }
    // エラー応答の場合
    if (statusCode >= 400) {
        (0, sentry_1.captureError)(`API error response: ${method} ${path} - ${statusCode}`, {
            extra: {
                responseTime,
                statusCode,
                userId,
            },
            tags: {
                category: 'api_error',
                method,
                path,
                status: statusCode.toString(),
            },
            level: statusCode >= 500 ? 'error' : 'warning'
        });
    }
}
/**
 * データベースエラーの詳細トラッキング
 */
async function trackDatabaseIssue(operation, table, error, query, params) {
    const sanitizedQuery = query?.replace(/('[^']*'|"[^"]*")/g, '***'); // リテラル値をマスク
    (0, error_tracking_1.trackDatabaseError)(operation, table, error, sanitizedQuery);
    // 特定のデータベースエラーパターンを検出
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('timeout')) {
        (0, sentry_1.captureError)('Database timeout detected', {
            extra: { operation, table, query: sanitizedQuery },
            tags: { category: 'database', issue: 'timeout' },
            level: 'warning'
        });
    }
    if (errorMessage.includes('connection')) {
        (0, sentry_1.captureError)('Database connection issue', {
            extra: { operation, table },
            tags: { category: 'database', issue: 'connection' },
            level: 'error'
        });
    }
    if (errorMessage.includes('deadlock')) {
        (0, sentry_1.captureError)('Database deadlock detected', {
            extra: { operation, table, query: sanitizedQuery },
            tags: { category: 'database', issue: 'deadlock' },
            level: 'warning'
        });
    }
}
/**
 * 外部API呼び出しエラーの追跡
 */
async function trackExternalAPIIssue(service, endpoint, method, statusCode, responseTime, error) {
    if (error) {
        (0, error_tracking_1.trackExternalAPIError)(service, endpoint, statusCode, error);
    }
    // 外部APIの問題を分析
    if (statusCode >= 500) {
        (0, sentry_1.captureError)(`External API server error: ${service}`, {
            extra: { endpoint, method, statusCode, responseTime },
            tags: { category: 'external_api', service, issue: 'server_error' },
            level: 'error'
        });
    }
    else if (statusCode === 429) {
        (0, sentry_1.captureError)(`External API rate limited: ${service}`, {
            extra: { endpoint, method, statusCode, responseTime },
            tags: { category: 'external_api', service, issue: 'rate_limited' },
            level: 'warning'
        });
    }
    else if (responseTime > 10000) { // 10秒以上
        (0, sentry_1.captureError)(`External API slow response: ${service}`, {
            extra: { endpoint, method, statusCode, responseTime },
            tags: { category: 'external_api', service, issue: 'slow_response' },
            level: 'warning'
        });
    }
}
/**
 * ビジネスロジックエラーの追跡
 */
async function trackBusinessIssue(operation, error, context) {
    (0, error_tracking_1.trackBusinessLogicError)(operation, error, context);
}
// ヘルパー関数
function getSentryLevel(severity) {
    switch (severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
            return 'error';
        case ErrorSeverity.MEDIUM:
            return 'warning';
        case ErrorSeverity.LOW:
            return 'info';
        default:
            return 'warning';
    }
}
function sanitizeRequestBody(body) {
    if (!body)
        return {};
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
    sensitiveFields.forEach(field => {
        if (sanitized[field])
            sanitized[field] = '***';
    });
    return sanitized;
}
async function saveErrorToDatabase(errorData, sentryErrorId) {
    try {
        // SecurityLogテーブルに保存（セキュリティ系のエラーの場合）
        if (errorData.category === ErrorCategory.SECURITY) {
            await prisma.securityLog.create({
                data: {
                    eventType: 'AUTHENTICATION_FAILURE', // 適切なイベントタイプを設定
                    severity: errorData.severity.toUpperCase(),
                    ipAddress: errorData.ipAddress || 'unknown',
                    userAgent: errorData.userAgent,
                    userId: errorData.userId,
                    url: errorData.endpoint,
                    method: errorData.method,
                    payload: JSON.stringify(errorData.context),
                    detectionEngine: 'API_ERROR_TRACKER',
                    confidence: 100,
                    riskScore: getSeverityScore(errorData.severity),
                    metadata: JSON.stringify({
                        sentryId: sentryErrorId,
                        errorCode: errorData.code,
                        errorMessage: errorData.message,
                    }),
                },
            });
        }
    }
    catch (dbError) {
        console.error('Failed to save error to database:', dbError);
    }
}
function getSeverityScore(severity) {
    switch (severity) {
        case ErrorSeverity.CRITICAL: return 90;
        case ErrorSeverity.HIGH: return 70;
        case ErrorSeverity.MEDIUM: return 50;
        case ErrorSeverity.LOW: return 30;
        default: return 50;
    }
}
async function handleSpecificErrorTypes(error, context) {
    // セキュリティエラーの場合は追加のアラートを送信
    if (error instanceof SecurityError) {
        // セキュリティアラートサービスと連携
        // await securityAlertService.sendSecurityAlert(error, context);
    }
    // 重要なビジネスロジックエラーの場合
    if (error instanceof BusinessLogicError && error.severity === ErrorSeverity.HIGH) {
        // ビジネス部門への通知
        // await notificationService.notifyBusinessTeam(error, context);
    }
    // データベース接続エラーの場合
    if (error instanceof DatabaseError) {
        // インフラチームへの通知
        // await notificationService.notifyInfraTeam(error, context);
    }
}
exports.default = {
    ErrorCategory,
    ErrorSeverity,
    CustomAPIError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    DatabaseError,
    ExternalAPIError,
    BusinessLogicError,
    SecurityError,
    trackError,
    trackAPIPerformance,
    trackDatabaseIssue,
    trackExternalAPIIssue,
    trackBusinessIssue,
};
