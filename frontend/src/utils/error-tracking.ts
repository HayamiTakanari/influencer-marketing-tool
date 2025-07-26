import * as Sentry from '@sentry/nextjs';

/**
 * エラートラッキングユーティリティ
 * Sentryとの統合とカスタムエラーハンドリング
 */

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

/**
 * ユーザー情報の設定
 */
export function setUserContext(user: UserContext): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  });
}

/**
 * ユーザー情報のクリア
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * カスタムタグの設定
 */
export function setCustomTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * エラーの手動報告
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext
): string {
  return Sentry.withScope((scope) => {
    // コンテキスト情報を追加
    if (context) {
      if (context.component) scope.setTag('component', context.component);
      if (context.action) scope.setTag('action', context.action);
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.url) scope.setTag('url', context.url);
      if (context.userAgent) scope.setTag('userAgent', context.userAgent);
      
      if (context.metadata) {
        scope.setContext('metadata', context.metadata);
      }
    }
    
    // ブラウザ情報を追加
    if (typeof window !== 'undefined') {
      scope.setContext('browser', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        screen: {
          width: screen.width,
          height: screen.height,
        }
      });
    }
    
    return typeof error === 'string' 
      ? Sentry.captureMessage(error, 'error')
      : Sentry.captureException(error);
  });
}

/**
 * 警告レベルの報告
 */
export function captureWarning(
  message: string,
  context?: ErrorContext
): string {
  return Sentry.withScope((scope) => {
    if (context) {
      if (context.component) scope.setTag('component', context.component);
      if (context.action) scope.setTag('action', context.action);
      if (context.metadata) scope.setContext('metadata', context.metadata);
    }
    
    return Sentry.captureMessage(message, 'warning');
  });
}

/**
 * 情報レベルの報告
 */
export function captureInfo(
  message: string,
  context?: ErrorContext
): string {
  return Sentry.withScope((scope) => {
    if (context) {
      if (context.component) scope.setTag('component', context.component);
      if (context.action) scope.setTag('action', context.action);
      if (context.metadata) scope.setContext('metadata', context.metadata);
    }
    
    return Sentry.captureMessage(message, 'info');
  });
}

/**
 * パフォーマンス測定の開始
 */
export function startPerformanceTransaction(name: string): any {
  return Sentry.startTransaction({
    name,
    op: 'custom',
    tags: {
      component: 'frontend',
    }
  });
}

/**
 * パフォーマンス測定の終了
 */
export function finishPerformanceTransaction(
  transaction: any,
  metrics?: PerformanceMetrics
): void {
  if (metrics) {
    transaction.setData('metrics', metrics);
  }
  transaction.finish();
}

/**
 * API呼び出しのトラッキング
 */
export function trackAPICall(
  url: string,
  method: string,
  status: number,
  duration: number,
  error?: Error
): void {
  const transaction = Sentry.startTransaction({
    name: `API ${method.toUpperCase()} ${url}`,
    op: 'http.client',
    tags: {
      'http.method': method,
      'http.status_code': status.toString(),
      'http.url': url,
    }
  });
  
  transaction.setData('duration', duration);
  
  if (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
  } else if (status >= 400) {
    transaction.setStatus(status >= 500 ? 'internal_error' : 'invalid_argument');
  } else {
    transaction.setStatus('ok');
  }
  
  transaction.finish();
}

/**
 * ページビューのトラッキング
 */
export function trackPageView(pageName: string, userId?: string): void {
  Sentry.withScope((scope) => {
    scope.setTag('page', pageName);
    if (userId) scope.setUser({ id: userId });
    
    scope.setContext('navigation', {
      page: pageName,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
    
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pageName}`,
      level: 'info',
    });
  });
}

/**
 * ユーザーアクションのトラッキング
 */
export function trackUserAction(
  action: string,
  component: string,
  metadata?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: `User performed: ${action}`,
    level: 'info',
    data: {
      component,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    }
  });
}

/**
 * フィーチャーフラグの設定
 */
export function setFeatureFlag(flag: string, enabled: boolean): void {
  Sentry.setTag(`feature.${flag}`, enabled.toString());
}

/**
 * A/Bテストの設定
 */
export function setExperimentInfo(experiment: string, variant: string): void {
  Sentry.setTag(`experiment.${experiment}`, variant);
}

/**
 * カスタムメトリクスの送信
 */
export function sendCustomMetric(
  name: string,
  value: number,
  unit: string = 'none',
  tags?: Record<string, string>
): void {
  // Sentryのメトリクス機能を使用
  Sentry.withScope((scope) => {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    scope.setContext('metric', {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.addBreadcrumb({
      category: 'metric',
      message: `Metric: ${name} = ${value} ${unit}`,
      level: 'info',
      data: { name, value, unit, ...tags }
    });
  });
}

// グローバルエラーハンドラーの設定
if (typeof window !== 'undefined') {
  // 未処理のJavaScriptエラー
  window.addEventListener('error', (event) => {
    captureError(event.error, {
      component: 'global',
      action: 'unhandled_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message,
      }
    });
  });
  
  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    captureError(
      event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason)),
      {
        component: 'global',
        action: 'unhandled_promise_rejection',
        metadata: {
          reason: event.reason,
        }
      }
    );
  });
  
  // リソース読み込みエラー
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      captureError(new Error(`Resource loading failed: ${(event.target as any)?.src || (event.target as any)?.href}`), {
        component: 'global',
        action: 'resource_load_error',
        metadata: {
          tagName: (event.target as any)?.tagName,
          src: (event.target as any)?.src,
          href: (event.target as any)?.href,
        }
      });
    }
  }, true);
}

export default {
  setUserContext,
  clearUserContext,
  setCustomTags,
  captureError,
  captureWarning,
  captureInfo,
  startPerformanceTransaction,
  finishPerformanceTransaction,
  trackAPICall,
  trackPageView,
  trackUserAction,
  setFeatureFlag,
  setExperimentInfo,
  sendCustomMetric,
};