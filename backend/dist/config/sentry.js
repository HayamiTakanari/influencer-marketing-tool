"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSentry = initializeSentry;
exports.setupSentryErrorHandler = setupSentryErrorHandler;
exports.setSentryUser = setSentryUser;
exports.clearSentryUser = clearSentryUser;
exports.setSentryTags = setSentryTags;
exports.captureError = captureError;
exports.trackAPIEndpoint = trackAPIEndpoint;
exports.trackDatabaseOperation = trackDatabaseOperation;
exports.trackBusinessMetric = trackBusinessMetric;
const Sentry = __importStar(require("@sentry/node"));
/**
 * Sentry初期化とExpress統合
 */
function initializeSentry(app) {
    // Sentryの初期化
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',
        // パフォーマンス監視
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        // リリース追跡
        release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        // セキュリティ: 機密情報のフィルタリング
        beforeSend(event, hint) {
            // リクエストヘッダーから機密情報を除去
            if (event.request && event.request.headers) {
                const sanitizedHeaders = { ...event.request.headers };
                // 機密情報を含む可能性のあるヘッダーをマスク
                const sensitiveHeaders = [
                    'authorization',
                    'cookie',
                    'x-api-key',
                    'x-auth-token',
                    'x-access-token',
                    'proxy-authorization'
                ];
                sensitiveHeaders.forEach(header => {
                    if (sanitizedHeaders[header]) {
                        sanitizedHeaders[header] = '***';
                    }
                });
                event.request.headers = sanitizedHeaders;
            }
            // リクエストデータから機密情報を除去
            if (event.request && event.request.data) {
                if (typeof event.request.data === 'object') {
                    const sanitizedData = { ...event.request.data };
                    const sensitiveFields = [
                        'password',
                        'token',
                        'secret',
                        'apiKey',
                        'accessToken',
                        'refreshToken',
                        'privateKey',
                        'clientSecret'
                    ];
                    sensitiveFields.forEach(field => {
                        if (sanitizedData[field]) {
                            sanitizedData[field] = '***';
                        }
                    });
                    event.request.data = sanitizedData;
                }
            }
            // URLからクエリパラメータの機密情報を除去
            if (event.request && event.request.url) {
                event.request.url = event.request.url.replace(/([?&])(password|token|api_key|secret)=[^&]*/gi, '$1$2=***');
            }
            return event;
        },
        // コンテキスト情報の追加
        initialScope: {
            tags: {
                server: process.env.NODE_ENV || 'development',
            },
            contexts: {
                runtime: {
                    name: 'node',
                    version: process.version,
                },
                os: {
                    name: process.platform,
                },
            },
        },
    });
    // Note: Sentry Express middleware is automatically integrated via Express integration
}
/**
 * エラーハンドラー（最後のミドルウェアとして設定）
 */
function setupSentryErrorHandler(app) {
    // Express error handler is automatically set up via Sentry.init()
    // No additional setup needed
}
/**
 * ユーザーコンテキストの設定
 */
function setSentryUser(user) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
    });
}
/**
 * ユーザーコンテキストのクリア
 */
function clearSentryUser() {
    Sentry.setUser(null);
}
/**
 * カスタムタグの設定
 */
function setSentryTags(tags) {
    Object.entries(tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
    });
}
/**
 * エラーの手動キャプチャ
 */
function captureError(error, context) {
    return Sentry.withScope((scope) => {
        if (context) {
            if (context.user)
                scope.setUser(context.user);
            if (context.extra)
                scope.setExtras(context.extra);
            if (context.tags) {
                Object.entries(context.tags).forEach(([key, value]) => {
                    scope.setTag(key, value);
                });
            }
            if (context.level)
                scope.setLevel(context.level);
        }
        return typeof error === 'string'
            ? Sentry.captureMessage(error, context?.level || 'error')
            : Sentry.captureException(error);
    });
}
/**
 * API呼び出しのトラッキング
 */
function trackAPIEndpoint(method, path, statusCode, duration, error) {
    Sentry.withScope((scope) => {
        scope.setTag('http.method', method);
        scope.setTag('http.status_code', statusCode.toString());
        scope.setTag('http.path', path);
        scope.setContext('api_endpoint', {
            method,
            path,
            statusCode,
            duration
        });
        if (error) {
            Sentry.captureException(error);
        }
        Sentry.addBreadcrumb({
            category: 'http',
            message: `${method.toUpperCase()} ${path}`,
            level: statusCode >= 400 ? 'warning' : 'info',
            data: { method, path, statusCode, duration }
        });
    });
}
/**
 * データベース操作のトラッキング
 */
function trackDatabaseOperation(operation, table, duration, error) {
    Sentry.withScope((scope) => {
        scope.setTag('db.operation', operation);
        scope.setTag('db.table', table);
        scope.setContext('database_operation', {
            operation,
            table,
            duration
        });
        if (error) {
            Sentry.captureException(error);
        }
        Sentry.addBreadcrumb({
            category: 'database',
            message: `DB ${operation} ${table}`,
            level: error ? 'error' : 'info',
            data: { operation, table, duration }
        });
    });
}
/**
 * ビジネスロジックのメトリクス
 */
function trackBusinessMetric(metricName, value, unit = 'count', tags) {
    Sentry.withScope((scope) => {
        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }
        scope.setContext('metric', {
            name: metricName,
            value,
            unit,
            timestamp: new Date().toISOString(),
        });
        Sentry.addBreadcrumb({
            category: 'metric',
            message: `Business metric: ${metricName} = ${value} ${unit}`,
            level: 'info',
            data: { metricName, value, unit, ...tags }
        });
    });
}
exports.default = {
    initializeSentry,
    setupSentryErrorHandler,
    setSentryUser,
    clearSentryUser,
    setSentryTags,
    captureError,
    trackAPIEndpoint,
    trackDatabaseOperation,
    trackBusinessMetric,
};
//# sourceMappingURL=sentry.js.map