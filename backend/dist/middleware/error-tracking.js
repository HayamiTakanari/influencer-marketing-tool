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
exports.requestTrackingMiddleware = requestTrackingMiddleware;
exports.userContextMiddleware = userContextMiddleware;
exports.apiErrorHandler = apiErrorHandler;
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
exports.trackDatabaseError = trackDatabaseError;
exports.trackExternalAPIError = trackExternalAPIError;
exports.trackBusinessLogicError = trackBusinessLogicError;
const Sentry = __importStar(require("@sentry/node"));
const sentry_1 = require("../config/sentry");
/**
 * リクエスト処理時間の測定とトラッキング
 */
function requestTrackingMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;
    // レスポンス送信時の処理をオーバーライド
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // API呼び出しをトラッキング
        (0, sentry_1.trackAPIEndpoint)(req.method, req.path, statusCode, duration);
        // パフォーマンス情報をSentryに送信
        Sentry.addBreadcrumb({
            category: 'http',
            message: `${req.method} ${req.path} - ${statusCode}`,
            level: statusCode >= 400 ? 'error' : 'info',
            data: {
                method: req.method,
                path: req.path,
                statusCode,
                duration,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
            }
        });
        // 遅いリクエストの警告
        if (duration > 5000) { // 5秒以上
            (0, sentry_1.captureError)(`Slow API response: ${req.method} ${req.path}`, {
                extra: {
                    duration,
                    statusCode,
                    method: req.method,
                    path: req.path,
                },
                tags: {
                    category: 'performance',
                    issue: 'slow_response'
                },
                level: 'warning'
            });
        }
        return originalSend.call(this, data);
    };
    next();
}
/**
 * ユーザーコンテキストの設定ミドルウェア
 */
function userContextMiddleware(req, res, next) {
    // 認証済みユーザー情報をSentryに設定
    if (req.user) {
        (0, sentry_1.setSentryUser)({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            isVerified: req.user.isVerified,
        });
        // リクエストコンテキストを追加
        Sentry.setContext('request', {
            userId: req.user.id,
            userEmail: req.user.email,
            userRole: req.user.role,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
    }
    next();
}
/**
 * APIエラーハンドリングミドルウェア
 */
function apiErrorHandler(error, req, res, next) {
    const statusCode = error.status || error.statusCode || 500;
    const errorMessage = error.message || 'Internal Server Error';
    // エラーコンテキストの設定
    const errorContext = {
        user: req.user ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
        } : undefined,
        extra: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            body: req.body,
            headers: {
                'user-agent': req.get('User-Agent'),
                'content-type': req.get('Content-Type'),
                'origin': req.get('Origin'),
                'referer': req.get('Referer'),
            },
            ip: req.ip,
            statusCode,
            stack: error.stack,
        },
        tags: {
            errorType: error.name || 'UnknownError',
            endpoint: `${req.method} ${req.path}`,
            severity: statusCode >= 500 ? 'high' : 'medium',
        },
        level: statusCode >= 500 ? 'error' : 'warning',
    };
    // 5xx エラーのみSentryに送信（4xxはクライアントエラーなので除外）
    if (statusCode >= 500) {
        (0, sentry_1.captureError)(error, errorContext);
    }
    // 開発環境ではコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
            error: errorMessage,
            stack: error.stack,
            statusCode,
            path: req.path,
            method: req.method,
            user: req.user?.id,
        });
    }
    // レスポンスの返却
    res.status(statusCode).json({
        error: true,
        message: statusCode >= 500 ? 'Internal Server Error' : errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
            details: error.stack,
            statusCode,
        }),
        timestamp: new Date().toISOString(),
        requestId: res.get('X-Request-ID') || Math.random().toString(36).substr(2, 9),
    });
}
/**
 * 未処理の例外をキャッチするグローバルハンドラー
 */
function setupGlobalErrorHandlers() {
    // 未処理の Promise 拒否
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Promise Rejection:', reason);
        (0, sentry_1.captureError)(reason instanceof Error ? reason : new Error(String(reason)), {
            extra: {
                type: 'unhandledRejection',
                promise: String(promise),
            },
            tags: {
                category: 'uncaught',
                type: 'promise_rejection'
            },
            level: 'error'
        });
        // プロセスを終了させない（本番環境では慎重に検討）
        if (process.env.NODE_ENV === 'production') {
            console.error('Shutting down due to unhandled promise rejection');
            process.exit(1);
        }
    });
    // 未処理の例外
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        (0, sentry_1.captureError)(error, {
            extra: {
                type: 'uncaughtException',
            },
            tags: {
                category: 'uncaught',
                type: 'exception'
            },
            level: 'error'
        });
        // 未処理の例外の場合はプロセスを終了
        console.error('Shutting down due to uncaught exception');
        process.exit(1);
    });
    // SIGTERM シグナル（Graceful shutdown）
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        (0, sentry_1.captureError)('Process received SIGTERM', {
            tags: {
                category: 'shutdown',
                signal: 'SIGTERM'
            },
            level: 'info'
        });
        // Sentryのデータ送信を待ってからプロセス終了
        Sentry.close(2000).then(() => {
            process.exit(0);
        });
    });
    // SIGINT シグナル（Ctrl+C）
    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        (0, sentry_1.captureError)('Process received SIGINT', {
            tags: {
                category: 'shutdown',
                signal: 'SIGINT'
            },
            level: 'info'
        });
        Sentry.close(2000).then(() => {
            process.exit(0);
        });
    });
}
/**
 * データベースエラーのトラッキング
 */
function trackDatabaseError(operation, table, error, query) {
    (0, sentry_1.captureError)(error, {
        extra: {
            operation,
            table,
            query: query?.substring(0, 500), // クエリは最初の500文字のみ
        },
        tags: {
            category: 'database',
            operation,
            table,
        },
        level: 'error'
    });
}
/**
 * 外部API呼び出しエラーのトラッキング
 */
function trackExternalAPIError(service, endpoint, statusCode, error) {
    (0, sentry_1.captureError)(error, {
        extra: {
            service,
            endpoint,
            statusCode,
        },
        tags: {
            category: 'external_api',
            service,
            endpoint,
        },
        level: 'error'
    });
}
/**
 * ビジネスロジックエラーのトラッキング
 */
function trackBusinessLogicError(operation, error, context) {
    (0, sentry_1.captureError)(error, {
        extra: {
            operation,
            ...context,
        },
        tags: {
            category: 'business_logic',
            operation,
        },
        level: 'error'
    });
}
exports.default = {
    requestTrackingMiddleware,
    userContextMiddleware,
    apiErrorHandler,
    setupGlobalErrorHandlers,
    trackDatabaseError,
    trackExternalAPIError,
    trackBusinessLogicError,
};
//# sourceMappingURL=error-tracking.js.map