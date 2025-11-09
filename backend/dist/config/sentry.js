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
const Tracing = __importStar(require("@sentry/tracing"));
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
        // 統合設定
        integrations: [
            // Express統合
            new Sentry.Integrations.Http({ tracing: true }),
            new Tracing.Integrations.Express({ app }),
            new Tracing.Integrations.Postgres(),
            new Tracing.Integrations.Prisma(),
        ],
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
        // タグの追加
        tags: {
            component: 'backend',
            framework: 'express',
            runtime: 'node'
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
    // リクエストハンドラー（最初のミドルウェアとして設定）
    app.use(Sentry.Handlers.requestHandler({
        user: ['id', 'email', 'role'],
        ip: true,
        transaction: 'methodPath',
    }));
    // トレーシングハンドラー
    app.use(Sentry.Handlers.tracingHandler());
}
/**
 * エラーハンドラー（最後のミドルウェアとして設定）
 */
function setupSentryErrorHandler(app) {
    app.use(Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // 4xx エラーは通常ログに出すが、Sentryには送信しない
            // 5xx エラーのみSentryに送信
            return error.status >= 500;
        },
    }));
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
    const transaction = Sentry.startTransaction({
        name: `${method.toUpperCase()} ${path}`,
        op: 'http.server',
        tags: {
            'http.method': method,
            'http.status_code': statusCode.toString(),
            'http.path': path,
        }
    });
    transaction.setData('duration', duration);
    if (error) {
        transaction.setStatus('internal_error');
        Sentry.captureException(error);
    }
    else if (statusCode >= 500) {
        transaction.setStatus('internal_error');
    }
    else if (statusCode >= 400) {
        transaction.setStatus('invalid_argument');
    }
    else {
        transaction.setStatus('ok');
    }
    transaction.finish();
}
/**
 * データベース操作のトラッキング
 */
function trackDatabaseOperation(operation, table, duration, error) {
    const transaction = Sentry.startTransaction({
        name: `DB ${operation} ${table}`,
        op: 'db.query',
        tags: {
            'db.operation': operation,
            'db.table': table,
        }
    });
    transaction.setData('duration', duration);
    if (error) {
        transaction.setStatus('internal_error');
        Sentry.captureException(error);
    }
    else {
        transaction.setStatus('ok');
    }
    transaction.finish();
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
