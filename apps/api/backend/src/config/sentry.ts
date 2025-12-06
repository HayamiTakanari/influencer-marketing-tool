import * as Sentry from '@sentry/node';
import { Express } from 'express';

/**
 * Sentry初期化とExpress統合
 */
export function initializeSentry(app: Express): void {
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
        event.request.url = event.request.url.replace(
          /([?&])(password|token|api_key|secret)=[^&]*/gi,
          '$1$2=***'
        );
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
export function setupSentryErrorHandler(app: Express): void {
  // Express error handler is automatically set up via Sentry.init()
  // No additional setup needed
}

/**
 * ユーザーコンテキストの設定
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
}): void {
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
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * カスタムタグの設定
 */
export function setSentryTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * エラーの手動キャプチャ
 */
export function captureError(
  error: Error | string,
  context?: {
    user?: any;
    extra?: Record<string, any>;
    tags?: Record<string, string>;
    level?: 'error' | 'warning' | 'info' | 'debug';
  }
): string {
  return Sentry.withScope((scope) => {
    if (context) {
      if (context.user) scope.setUser(context.user);
      if (context.extra) scope.setExtras(context.extra);
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context.level) scope.setLevel(context.level);
    }
    
    return typeof error === 'string'
      ? Sentry.captureMessage(error, context?.level || 'error')
      : Sentry.captureException(error);
  });
}

/**
 * API呼び出しのトラッキング
 */
export function trackAPIEndpoint(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  error?: Error
): void {
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
export function trackDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  error?: Error
): void {
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
export function trackBusinessMetric(
  metricName: string,
  value: number,
  unit: string = 'count',
  tags?: Record<string, string>
): void {
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

export default {
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