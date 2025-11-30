import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { captureError, trackAPIEndpoint, setSentryUser } from '../config/sentry';

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
export function requestTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // レスポンス送信時の処理をオーバーライド
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // API呼び出しをトラッキング
    trackAPIEndpoint(
      req.method,
      req.path,
      statusCode,
      duration
    );
    
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
      captureError(`Slow API response: ${req.method} ${req.path}`, {
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
export function userContextMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 認証済みユーザー情報をSentryに設定
  if (req.user) {
    setSentryUser({
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
export function apiErrorHandler(
  error: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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
    level: statusCode >= 500 ? 'error' : 'warning' as any,
  };
  
  // 5xx エラーのみSentryに送信（4xxはクライアントエラーなので除外）
  if (statusCode >= 500) {
    captureError(error, errorContext);
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
export function setupGlobalErrorHandlers(): void {
  // 未処理の Promise 拒否
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Promise Rejection:', reason);
    
    captureError(
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        extra: {
          type: 'unhandledRejection',
          promise: String(promise),
        },
        tags: {
          category: 'uncaught',
          type: 'promise_rejection'
        },
        level: 'error'
      }
    );
    
    // プロセスを終了させない（本番環境では慎重に検討）
    if (process.env.NODE_ENV === 'production') {
      console.error('Shutting down due to unhandled promise rejection');
      process.exit(1);
    }
  });
  
  // 未処理の例外
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    
    captureError(error, {
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
    
    captureError('Process received SIGTERM', {
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
    
    captureError('Process received SIGINT', {
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
export function trackDatabaseError(
  operation: string,
  table: string,
  error: Error,
  query?: string
): void {
  captureError(error, {
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
export function trackExternalAPIError(
  service: string,
  endpoint: string,
  statusCode: number,
  error: Error
): void {
  captureError(error, {
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
export function trackBusinessLogicError(
  operation: string,
  error: Error,
  context?: Record<string, any>
): void {
  captureError(error, {
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

export default {
  requestTrackingMiddleware,
  userContextMiddleware,
  apiErrorHandler,
  setupGlobalErrorHandlers,
  trackDatabaseError,
  trackExternalAPIError,
  trackBusinessLogicError,
};