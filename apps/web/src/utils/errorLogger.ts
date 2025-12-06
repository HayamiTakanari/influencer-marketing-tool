/**
 * 包括的なエラーロギングシステム
 * すべてのエラーを一箇所に集約して分析
 */

interface ErrorLog {
  timestamp: string;
  type: string;
  page: string;
  message: string;
  url: string;
  statusCode?: number;
  stack?: string;
  context?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 50; // 最新50件を保持

  log(error: any, type: string = 'ERROR', context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      message: error?.message || String(error),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      statusCode: error?.response?.status,
      stack: error?.stack,
      context
    };

    this.logs.push(errorLog);

    // 最大数を超えたら古いエラーを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // コンソールに出力
    console.error(`[${type}] ${errorLog.message}`, errorLog);

    // localStorage に保存（開発時用）
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('errorLogs', JSON.stringify(this.logs));
      } catch (e) {
        // localStorage が満杯の場合などは無視
      }
    }

    return errorLog;
  }

  logAPIError(endpoint: string, status: number, error: any, context?: Record<string, any>) {
    return this.log(error, `API_ERROR_${status}`, {
      endpoint,
      status,
      ...context
    });
  }

  logComponentError(componentName: string, error: any, context?: Record<string, any>) {
    return this.log(error, `COMPONENT_ERROR`, {
      component: componentName,
      ...context
    });
  }

  logNavigationError(fromPage: string, toPage: string, error: any) {
    return this.log(error, 'NAVIGATION_ERROR', {
      from: fromPage,
      to: toPage
    });
  }

  getAllLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getLogsByType(type: string): ErrorLog[] {
    return this.logs.filter(log => log.type === type);
  }

  getLogsByPage(page: string): ErrorLog[] {
    return this.logs.filter(log => log.page === page);
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('errorLogs');
    }
  }

  printSummary() {
    console.group('=== Error Summary ===');
    const byType = new Map<string, number>();
    const byPage = new Map<string, number>();

    this.logs.forEach(log => {
      byType.set(log.type, (byType.get(log.type) || 0) + 1);
      byPage.set(log.page, (byPage.get(log.page) || 0) + 1);
    });

    console.log('エラー数（タイプ別）:', Object.fromEntries(byType));
    console.log('エラー数（ページ別）:', Object.fromEntries(byPage));
    console.log('全エラー:', this.logs);
    console.groupEnd();
  }
}

export const errorLogger = new ErrorLogger();
