import { PrismaClient } from '@prisma/client';
import { captureError, trackAPIEndpoint } from '../config/sentry';
import { trackDatabaseError, trackExternalAPIError, trackBusinessLogicError } from '../middleware/error-tracking';

const prisma = new PrismaClient();

/**
 * API エラートラッキングユーティリティ
 * 様々なタイプのエラーを分類・追跡・報告
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
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
export class CustomAPIError extends Error implements APIError {
  public status: number;
  public code: string;
  public category: ErrorCategory;
  public severity: ErrorSeverity;
  public context: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'CustomAPIError';
    this.status = status;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends CustomAPIError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      context
    );
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends CustomAPIError {
  constructor(message: string = 'Authentication required', context: Record<string, any> = {}) {
    super(
      message,
      401,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      context
    );
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends CustomAPIError {
  constructor(message: string = 'Access denied', context: Record<string, any> = {}) {
    super(
      message,
      403,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      context
    );
  }
}

/**
 * リソース未発見エラー
 */
export class NotFoundError extends CustomAPIError {
  constructor(resource: string = 'Resource', context: Record<string, any> = {}) {
    super(
      `${resource} not found`,
      404,
      'NOT_FOUND_ERROR',
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      context
    );
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends CustomAPIError {
  constructor(message: string = 'Too many requests', context: Record<string, any> = {}) {
    super(
      message,
      429,
      'RATE_LIMIT_ERROR',
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      context
    );
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends CustomAPIError {
  constructor(message: string, originalError?: Error, context: Record<string, any> = {}) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      { ...context, originalError: originalError?.message }
    );
  }
}

/**
 * 外部APIエラー
 */
export class ExternalAPIError extends CustomAPIError {
  constructor(
    service: string,
    statusCode: number,
    message: string,
    context: Record<string, any> = {}
  ) {
    super(
      `External API error from ${service}: ${message}`,
      502,
      'EXTERNAL_API_ERROR',
      ErrorCategory.EXTERNAL_API,
      statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      { ...context, service, externalStatusCode: statusCode }
    );
  }
}

/**
 * ビジネスロジックエラー
 */
export class BusinessLogicError extends CustomAPIError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      422,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      context
    );
  }
}

/**
 * セキュリティエラー
 */
export class SecurityError extends CustomAPIError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      400,
      'SECURITY_ERROR',
      ErrorCategory.SECURITY,
      ErrorSeverity.HIGH,
      context
    );
  }
}

/**
 * エラーの統合トラッキング
 */
export async function trackError(
  error: Error | CustomAPIError,
  context: ErrorContext
): Promise<void> {
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
    const sentryErrorId = captureError(error, {
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

  } catch (trackingError) {
    console.error('Error tracking failed:', trackingError);
    // エラートラッキング自体の失敗はSentryに送信
    captureError(trackingError as Error, {
      tags: { category: 'error_tracking', issue: 'tracking_failure' },
      level: 'warning'
    });
  }
}

/**
 * API応答時間の監視
 */
export function trackAPIPerformance(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string
): void {
  // 正常なレスポンスの場合
  trackAPIEndpoint(method, path, statusCode, responseTime);

  // 遅いAPIの警告
  if (responseTime > 3000) { // 3秒以上
    captureError(`Slow API response: ${method} ${path}`, {
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
    captureError(`API error response: ${method} ${path} - ${statusCode}`, {
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
export async function trackDatabaseIssue(
  operation: string,
  table: string,
  error: Error,
  query?: string,
  params?: any[]
): Promise<void> {
  const sanitizedQuery = query?.replace(/('[^']*'|"[^"]*")/g, '***'); // リテラル値をマスク
  
  trackDatabaseError(operation, table, error, sanitizedQuery);

  // 特定のデータベースエラーパターンを検出
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    captureError('Database timeout detected', {
      extra: { operation, table, query: sanitizedQuery },
      tags: { category: 'database', issue: 'timeout' },
      level: 'warning'
    });
  }
  
  if (errorMessage.includes('connection')) {
    captureError('Database connection issue', {
      extra: { operation, table },
      tags: { category: 'database', issue: 'connection' },
      level: 'error'
    });
  }
  
  if (errorMessage.includes('deadlock')) {
    captureError('Database deadlock detected', {
      extra: { operation, table, query: sanitizedQuery },
      tags: { category: 'database', issue: 'deadlock' },
      level: 'warning'
    });
  }
}

/**
 * 外部API呼び出しエラーの追跡
 */
export async function trackExternalAPIIssue(
  service: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  error?: Error
): Promise<void> {
  if (error) {
    trackExternalAPIError(service, endpoint, statusCode, error);
  }

  // 外部APIの問題を分析
  if (statusCode >= 500) {
    captureError(`External API server error: ${service}`, {
      extra: { endpoint, method, statusCode, responseTime },
      tags: { category: 'external_api', service, issue: 'server_error' },
      level: 'error'
    });
  } else if (statusCode === 429) {
    captureError(`External API rate limited: ${service}`, {
      extra: { endpoint, method, statusCode, responseTime },
      tags: { category: 'external_api', service, issue: 'rate_limited' },
      level: 'warning'
    });
  } else if (responseTime > 10000) { // 10秒以上
    captureError(`External API slow response: ${service}`, {
      extra: { endpoint, method, statusCode, responseTime },
      tags: { category: 'external_api', service, issue: 'slow_response' },
      level: 'warning'
    });
  }
}

/**
 * ビジネスロジックエラーの追跡
 */
export async function trackBusinessIssue(
  operation: string,
  error: Error,
  context?: Record<string, any>
): Promise<void> {
  trackBusinessLogicError(operation, error, context);
}

// ヘルパー関数

function getSentryLevel(severity: ErrorSeverity): 'error' | 'warning' | 'info' | 'debug' {
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

function sanitizeRequestBody(body?: Record<string, any>): Record<string, any> {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) sanitized[field] = '***';
  });
  
  return sanitized;
}

async function saveErrorToDatabase(errorData: any, sentryErrorId: string): Promise<void> {
  try {
    // SecurityLogテーブルに保存（セキュリティ系のエラーの場合）
    if (errorData.category === ErrorCategory.SECURITY) {
      await prisma.securityLog.create({
        data: {
          eventType: 'AUTHENTICATION_FAILURE', // 適切なイベントタイプを設定
          severity: errorData.severity.toUpperCase() as any,
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
  } catch (dbError) {
    console.error('Failed to save error to database:', dbError);
  }
}

function getSeverityScore(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.CRITICAL: return 90;
    case ErrorSeverity.HIGH: return 70;
    case ErrorSeverity.MEDIUM: return 50;
    case ErrorSeverity.LOW: return 30;
    default: return 50;
  }
}

async function handleSpecificErrorTypes(error: Error | CustomAPIError, context: ErrorContext): Promise<void> {
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

export default {
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