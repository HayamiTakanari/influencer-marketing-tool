import { Request } from 'express';
import { setSentryUser, setSentryTags } from '../config/sentry';

/**
 * エラーコンテキスト構築ユーティリティ
 * ユーザー情報、環境情報、リクエスト情報を統合してSentryに送信
 */

export interface UserInfo {
  id: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  plan?: string;
  subscriptionId?: string;
  companyId?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
}

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  isMobile?: boolean;
  screenResolution?: string;
  timezone?: string;
  language?: string;
}

export interface SessionInfo {
  sessionId?: string;
  sessionStartTime?: Date;
  sessionDuration?: number;
  pageViews?: number;
  actionsPerformed?: string[];
  referrer?: string;
  entryPage?: string;
  isFirstVisit?: boolean;
}

export interface RequestInfo {
  method: string;
  path: string;
  url: string;
  ipAddress: string;
  headers: Record<string, string>;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: Record<string, any>;
  timestamp: Date;
  responseTime?: number;
  statusCode?: number;
}

export interface EnvironmentInfo {
  environment: string;
  version: string;
  buildNumber?: string;
  deploymentId?: string;
  region?: string;
  serverInstance?: string;
  nodeVersion: string;
  dbConnections?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  uptime?: number;
}

export interface BusinessContext {
  feature?: string;
  operation?: string;
  resourceType?: string;
  resourceId?: string;
  workflowStep?: string;
  experimentId?: string;
  experimentVariant?: string;
  featureFlags?: Record<string, boolean>;
}

/**
 * リクエストからユーザー情報を抽出
 */
export function extractUserInfo(req: any): UserInfo | undefined {
  if (!req.user) return undefined;

  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    isVerified: req.user.isVerified,
    plan: req.user.plan,
    subscriptionId: req.user.subscriptionId,
    companyId: req.user.companyId,
    lastLoginAt: req.user.lastLoginAt,
    createdAt: req.user.createdAt,
  };
}

/**
 * リクエストからデバイス情報を抽出
 */
export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.get('User-Agent') || '';
  
  return {
    userAgent,
    platform: extractPlatform(userAgent),
    browser: extractBrowser(userAgent),
    browserVersion: extractBrowserVersion(userAgent),
    os: extractOS(userAgent),
    osVersion: extractOSVersion(userAgent),
    isMobile: isMobileDevice(userAgent),
    timezone: req.get('X-Timezone'),
    language: req.get('Accept-Language')?.split(',')[0],
  };
}

/**
 * リクエストからセッション情報を抽出
 */
export function extractSessionInfo(req: any): SessionInfo {
  return {
    sessionId: req.sessionID || req.get('X-Session-ID'),
    referrer: req.get('Referer'),
    isFirstVisit: req.get('X-First-Visit') === 'true',
  };
}

/**
 * リクエスト情報を抽出
 */
export function extractRequestInfo(req: Request): RequestInfo {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitizedHeaders: Record<string, string> = {};
  
  Object.entries(req.headers).forEach(([key, value]) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitizedHeaders[key] = '***';
    } else {
      sanitizedHeaders[key] = Array.isArray(value) ? value.join(', ') : (value || '');
    }
  });

  return {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    headers: sanitizedHeaders,
    params: req.params,
    query: req.query,
    body: sanitizeRequestBody(req.body),
    timestamp: new Date(),
  };
}

/**
 * 環境情報を取得
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const memoryUsage = process.memoryUsage();
  
  return {
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || 'unknown',
    buildNumber: process.env.BUILD_NUMBER,
    deploymentId: process.env.DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA,
    region: process.env.REGION || process.env.VERCEL_REGION,
    serverInstance: process.env.SERVER_INSTANCE || process.env.HOSTNAME,
    nodeVersion: process.version,
    memoryUsage,
    uptime: process.uptime(),
  };
}

/**
 * ビジネスコンテキストを設定
 */
export function setBusinessContext(context: BusinessContext): void {
  const tags: Record<string, string> = {};
  
  if (context.feature) tags.feature = context.feature;
  if (context.operation) tags.operation = context.operation;
  if (context.resourceType) tags.resourceType = context.resourceType;
  if (context.resourceId) tags.resourceId = context.resourceId;
  if (context.workflowStep) tags.workflowStep = context.workflowStep;
  if (context.experimentId) tags.experimentId = context.experimentId;
  if (context.experimentVariant) tags.experimentVariant = context.experimentVariant;
  
  setSentryTags(tags);
  
  // フィーチャーフラグの設定
  if (context.featureFlags) {
    Object.entries(context.featureFlags).forEach(([flag, enabled]) => {
      setSentryTags({ [`feature_${flag}`]: enabled.toString() });
    });
  }
}

/**
 * 完全なエラーコンテキストを構築
 */
export function buildErrorContext(req: Request, additionalContext?: Partial<BusinessContext>) {
  const userInfo = extractUserInfo(req);
  const deviceInfo = extractDeviceInfo(req);
  const sessionInfo = extractSessionInfo(req);
  const requestInfo = extractRequestInfo(req);
  const environmentInfo = getEnvironmentInfo();

  // Sentryにユーザー情報を設定
  if (userInfo) {
    setSentryUser({
      id: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      isVerified: userInfo.isVerified,
    });
  }

  // 環境タグを設定
  setSentryTags({
    environment: environmentInfo.environment,
    version: environmentInfo.version,
    region: environmentInfo.region || 'unknown',
    platform: deviceInfo.platform || 'unknown',
    browser: deviceInfo.browser || 'unknown',
    os: deviceInfo.os || 'unknown',
    isMobile: deviceInfo.isMobile ? 'true' : 'false',
    method: requestInfo.method,
    endpoint: requestInfo.path,
  });

  // ビジネスコンテキストの設定
  if (additionalContext) {
    setBusinessContext(additionalContext);
  }

  return {
    user: userInfo,
    device: deviceInfo,
    session: sessionInfo,
    request: requestInfo,
    environment: environmentInfo,
    business: additionalContext,
  };
}

/**
 * パフォーマンスメトリクスの追跡
 */
export function trackPerformanceMetrics(metrics: {
  operation: string;
  duration: number;
  memoryBefore?: NodeJS.MemoryUsage;
  memoryAfter?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  customMetrics?: Record<string, number>;
}): void {
  setSentryTags({
    operation: metrics.operation,
    performance_category: 'timing',
  });

  // メモリ使用量の変化を計算
  if (metrics.memoryBefore && metrics.memoryAfter) {
    const memoryDelta = {
      heapUsed: metrics.memoryAfter.heapUsed - metrics.memoryBefore.heapUsed,
      heapTotal: metrics.memoryAfter.heapTotal - metrics.memoryBefore.heapTotal,
      external: metrics.memoryAfter.external - metrics.memoryBefore.external,
    };
    
    // メモリリークの可能性を検出
    if (memoryDelta.heapUsed > 50 * 1024 * 1024) { // 50MB以上の増加
      console.warn(`Potential memory leak detected in ${metrics.operation}`, memoryDelta);
    }
  }
}

// ヘルパー関数

function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken',
    'privateKey', 'clientSecret', 'creditCard', 'ssn', 'phoneNumber'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
}

function extractPlatform(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

function extractBrowser(userAgent: string): string {
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'Chrome';
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari';
  if (/Edge/i.test(userAgent)) return 'Edge';
  if (/Opera/i.test(userAgent)) return 'Opera';
  return 'Unknown';
}

function extractBrowserVersion(userAgent: string): string {
  const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge|Opera)\/([0-9.]+)/i);
  return match ? match[1] : 'Unknown';
}

function extractOS(userAgent: string): string {
  if (/Windows NT 10/i.test(userAgent)) return 'Windows 10';
  if (/Windows NT 6.3/i.test(userAgent)) return 'Windows 8.1';
  if (/Windows NT 6.2/i.test(userAgent)) return 'Windows 8';
  if (/Windows NT 6.1/i.test(userAgent)) return 'Windows 7';
  if (/Mac OS X 10[._](\d+)/i.test(userAgent)) {
    const match = userAgent.match(/Mac OS X 10[._](\d+)/i);
    return `macOS 10.${match?.[1] || 'x'}`;
  }
  if (/Android ([0-9.]+)/i.test(userAgent)) {
    const match = userAgent.match(/Android ([0-9.]+)/i);
    return `Android ${match?.[1] || 'x'}`;
  }
  if (/iPhone OS ([0-9_]+)/i.test(userAgent)) {
    const match = userAgent.match(/iPhone OS ([0-9_]+)/i);
    return `iOS ${match?.[1]?.replace(/_/g, '.') || 'x'}`;
  }
  return extractPlatform(userAgent);
}

function extractOSVersion(userAgent: string): string {
  const osVersionMatch = userAgent.match(/(?:Windows NT|Mac OS X|Android|iPhone OS) ([0-9._]+)/i);
  return osVersionMatch ? osVersionMatch[1].replace(/_/g, '.') : 'Unknown';
}

function isMobileDevice(userAgent: string): boolean {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(userAgent);
}

export default {
  extractUserInfo,
  extractDeviceInfo,
  extractSessionInfo,
  extractRequestInfo,
  getEnvironmentInfo,
  setBusinessContext,
  buildErrorContext,
  trackPerformanceMetrics,
};