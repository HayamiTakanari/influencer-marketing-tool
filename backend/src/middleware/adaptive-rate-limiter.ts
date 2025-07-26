import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { captureError } from '../config/sentry';

const prisma = new PrismaClient();

/**
 * 適応的レート制限ミドルウェア
 * 動的な閾値調整とインテリジェントなレート制限を実現
 */

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string | RegExp; // URLパターン
  method?: string; // HTTPメソッド
  userType?: 'anonymous' | 'authenticated' | 'premium' | 'admin' | 'all';
  limits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    concurrentRequests: number;
  };
  burstCapacity: number; // バーストアクセス許容数
  enabled: boolean;
  priority: number; // ルールの優先度
  skipSuccessfulRequests?: boolean; // 成功リクエストをカウントから除外
  skipFailedRequests?: boolean; // 失敗リクエストをカウントから除外
  keyGenerator?: (req: Request) => string; // カスタムキー生成
  onLimitReached?: (req: Request, res: Response) => void; // 制限到達時の処理
}

export interface RateLimitConfig {
  globalEnabled: boolean;
  rules: RateLimitRule[];
  whitelist: {
    ips: string[];
    userIds: string[];
    userAgents: RegExp[];
  };
  blacklist: {
    ips: string[];
    userIds: string[];
    userAgents: RegExp[];
  };
  adaptiveThresholds: {
    enabled: boolean;
    learningPeriod: number; // 学習期間（分）
    adjustmentFactor: number; // 調整係数（0.1-2.0）
    minThreshold: number; // 最小閾値
    maxThreshold: number; // 最大閾値
  };
  emergencyMode: {
    enabled: boolean;
    triggerThreshold: number; // 緊急モード発動閾値
    restrictionLevel: number; // 制限レベル（0.1-1.0）
    duration: number; // 緊急モード継続時間（分）
  };
}

export interface RateLimitMetrics {
  requestCounts: Map<string, number>;
  lastReset: Map<string, Date>;
  violationCounts: Map<string, number>;
  averageResponseTimes: Map<string, number[]>;
  concurrentRequests: Map<string, number>;
  adaptiveThresholds: Map<string, number>;
}

export interface RateLimitViolation {
  id: string;
  timestamp: Date;
  ipAddress: string;
  userId?: string;
  userAgent: string;
  endpoint: string;
  method: string;
  ruleId: string;
  violationType: 'rate_exceeded' | 'burst_exceeded' | 'concurrent_exceeded';
  requestCount: number;
  allowedCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionTaken: 'warning' | 'temporary_block' | 'permanent_block' | 'captcha_required';
}

class AdaptiveRateLimiter {
  private config: RateLimitConfig;
  private metrics: RateLimitMetrics;
  private emergencyModeActive: boolean = false;
  private emergencyModeEndTime?: Date;
  private adaptiveLearningData: Map<string, number[]> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      globalEnabled: true,
      rules: [],
      whitelist: { ips: [], userIds: [], userAgents: [] },
      blacklist: { ips: [], userIds: [], userAgents: [] },
      adaptiveThresholds: {
        enabled: true,
        learningPeriod: 60,
        adjustmentFactor: 1.2,
        minThreshold: 10,
        maxThreshold: 1000
      },
      emergencyMode: {
        enabled: true,
        triggerThreshold: 1000,
        restrictionLevel: 0.3,
        duration: 30
      },
      ...config
    };

    this.metrics = {
      requestCounts: new Map(),
      lastReset: new Map(),
      violationCounts: new Map(),
      averageResponseTimes: new Map(),
      concurrentRequests: new Map(),
      adaptiveThresholds: new Map()
    };

    this.initializeDefaultRules();
    this.startPeriodicTasks();
  }

  /**
   * メインのレート制限ミドルウェア
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!this.config.globalEnabled) {
          return next();
        }

        const clientInfo = this.extractClientInfo(req);

        // ホワイトリストチェック
        if (this.isWhitelisted(clientInfo)) {
          return next();
        }

        // ブラックリストチェック
        if (this.isBlacklisted(clientInfo)) {
          return this.rejectRequest(res, 'IP_BLACKLISTED', 403);
        }

        // 緊急モードチェック
        await this.checkEmergencyMode();

        // 適用可能なルールを取得
        const applicableRules = this.getApplicableRules(req);

        if (applicableRules.length === 0) {
          return next();
        }

        // 各ルールをチェック
        for (const rule of applicableRules) {
          const limitResult = await this.checkRateLimit(req, rule, clientInfo);

          if (!limitResult.allowed) {
            await this.recordViolation(req, rule, limitResult);
            return this.handleRateLimitViolation(req, res, rule, limitResult);
          }
        }

        // 同時接続数の追跡
        this.trackConcurrentRequest(clientInfo.key, true);

        // レスポンス完了時の処理
        res.on('finish', () => {
          this.trackConcurrentRequest(clientInfo.key, false);
          this.updateMetrics(req, res, clientInfo);
        });

        next();

      } catch (error) {
        console.error('Rate limiter error:', error);
        captureError(error as Error, {
          tags: { category: 'rate_limiter', issue: 'middleware_error' },
          level: 'warning'
        });
        next(); // エラー時はリクエストを通す
      }
    };
  }

  /**
   * クライアント情報の抽出
   */
  private extractClientInfo(req: Request): {
    ip: string;
    userId?: string;
    userAgent: string;
    userType: string;
    key: string;
  } {
    const ip = this.getClientIP(req);
    const userId = (req as any).user?.id;
    const userAgent = req.get('User-Agent') || '';
    const userType = this.determineUserType(req);
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    return { ip, userId, userAgent, userType, key };
  }

  /**
   * レート制限チェック
   */
  private async checkRateLimit(req: Request, rule: RateLimitRule, clientInfo: any): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: Date;
    violationType?: string;
    currentCount: number;
  }> {
    const key = rule.keyGenerator ? rule.keyGenerator(req) : `${rule.id}:${clientInfo.key}`;
    const now = Date.now();

    // 現在のカウントを取得
    const counts = await this.getCurrentCounts(key);
    
    // 適応的閾値の取得
    const adaptiveThresholds = this.getAdaptiveThresholds(rule, key);

    // 各時間窓でのチェック
    const checks = [
      {
        period: 'second',
        limit: adaptiveThresholds.requestsPerSecond || rule.limits.requestsPerSecond,
        current: counts.second
      },
      {
        period: 'minute',
        limit: adaptiveThresholds.requestsPerMinute || rule.limits.requestsPerMinute,
        current: counts.minute
      },
      {
        period: 'hour',
        limit: adaptiveThresholds.requestsPerHour || rule.limits.requestsPerHour,
        current: counts.hour
      },
      {
        period: 'day',
        limit: adaptiveThresholds.requestsPerDay || rule.limits.requestsPerDay,
        current: counts.day
      }
    ];

    // 緊急モード時の制限強化
    if (this.emergencyModeActive) {
      checks.forEach(check => {
        check.limit = Math.floor(check.limit * this.config.emergencyMode.restrictionLevel);
      });
    }

    // バーストキャパシティチェック
    const burstCheck = this.checkBurstCapacity(key, rule.burstCapacity);
    if (!burstCheck.allowed) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: new Date(now + 1000),
        violationType: 'burst_exceeded',
        currentCount: burstCheck.currentCount
      };
    }

    // 同時接続数チェック
    const concurrentCount = this.metrics.concurrentRequests.get(clientInfo.key) || 0;
    if (concurrentCount >= rule.limits.concurrentRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: new Date(now + 1000),
        violationType: 'concurrent_exceeded',
        currentCount: concurrentCount
      };
    }

    // 各時間窓でのチェック
    for (const check of checks) {
      if (check.current >= check.limit) {
        return {
          allowed: false,
          remainingRequests: Math.max(0, check.limit - check.current),
          resetTime: this.getResetTime(check.period),
          violationType: `${check.period}_exceeded`,
          currentCount: check.current
        };
      }
    }

    // カウントの更新
    await this.incrementCounts(key);

    return {
      allowed: true,
      remainingRequests: Math.min(...checks.map(c => c.limit - c.current - 1)),
      resetTime: this.getResetTime('minute'),
      currentCount: counts.minute + 1
    };
  }

  /**
   * 適応的閾値の計算
   */
  private getAdaptiveThresholds(rule: RateLimitRule, key: string): Partial<RateLimitRule['limits']> {
    if (!this.config.adaptiveThresholds.enabled) {
      return {};
    }

    const learningData = this.adaptiveLearningData.get(key) || [];
    if (learningData.length < 10) {
      return {}; // 学習データが不足
    }

    // 過去のアクセスパターンから適応的閾値を計算
    const average = learningData.reduce((a, b) => a + b, 0) / learningData.length;
    const factor = this.config.adaptiveThresholds.adjustmentFactor;
    
    const adaptiveLimit = Math.floor(average * factor);
    const minLimit = this.config.adaptiveThresholds.minThreshold;
    const maxLimit = this.config.adaptiveThresholds.maxThreshold;
    
    const adjustedLimit = Math.max(minLimit, Math.min(maxLimit, adaptiveLimit));

    return {
      requestsPerMinute: adjustedLimit,
      requestsPerHour: adjustedLimit * 60,
    };
  }

  /**
   * バーストキャパシティチェック
   */
  private checkBurstCapacity(key: string, capacity: number): { allowed: boolean; currentCount: number } {
    const burstKey = `burst:${key}`;
    const now = Date.now();
    const windowMs = 10000; // 10秒のバーストウィンドウ
    
    const burstData = this.metrics.requestCounts.get(burstKey) || 0;
    const lastReset = this.metrics.lastReset.get(burstKey) || new Date(0);
    
    if (now - lastReset.getTime() > windowMs) {
      this.metrics.requestCounts.set(burstKey, 1);
      this.metrics.lastReset.set(burstKey, new Date());
      return { allowed: true, currentCount: 1 };
    }
    
    const currentCount = burstData + 1;
    this.metrics.requestCounts.set(burstKey, currentCount);
    
    return {
      allowed: currentCount <= capacity,
      currentCount
    };
  }

  /**
   * 緊急モードの確認
   */
  private async checkEmergencyMode(): Promise<void> {
    if (!this.config.emergencyMode.enabled) return;

    const now = new Date();

    // 緊急モードの終了チェック
    if (this.emergencyModeActive && this.emergencyModeEndTime && now > this.emergencyModeEndTime) {
      this.emergencyModeActive = false;
      this.emergencyModeEndTime = undefined;
      console.log('Emergency mode deactivated');
    }

    // 緊急モード発動の判定
    if (!this.emergencyModeActive) {
      const recentViolations = await this.getRecentViolationCount(5); // 過去5分
      
      if (recentViolations > this.config.emergencyMode.triggerThreshold) {
        this.activateEmergencyMode();
      }
    }
  }

  /**
   * 緊急モードの発動
   */
  private activateEmergencyMode(): void {
    this.emergencyModeActive = true;
    this.emergencyModeEndTime = new Date(Date.now() + this.config.emergencyMode.duration * 60 * 1000);
    
    console.warn('Emergency mode activated due to high violation rate');
    
    // 緊急モード発動の通知
    captureError(new Error('Emergency rate limiting mode activated'), {
      tags: { category: 'rate_limiter', event: 'emergency_mode_activated' },
      level: 'warning',
      extra: {
        duration: this.config.emergencyMode.duration,
        restrictionLevel: this.config.emergencyMode.restrictionLevel
      }
    });
  }

  /**
   * レート制限違反の処理
   */
  private async handleRateLimitViolation(
    req: Request,
    res: Response,
    rule: RateLimitRule,
    limitResult: any
  ): Promise<void> {
    const headers = {
      'X-RateLimit-Limit': rule.limits.requestsPerMinute.toString(),
      'X-RateLimit-Remaining': limitResult.remainingRequests.toString(),
      'X-RateLimit-Reset': limitResult.resetTime.toISOString(),
      'Retry-After': Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000).toString()
    };

    // ヘッダーの設定
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // カスタム処理の実行
    if (rule.onLimitReached) {
      rule.onLimitReached(req, res);
      return;
    }

    // デフォルトのレスポンス
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded for ${rule.name}`,
      details: {
        limit: rule.limits.requestsPerMinute,
        current: limitResult.currentCount,
        resetTime: limitResult.resetTime,
        violationType: limitResult.violationType
      },
      retryAfter: Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000)
    });
  }

  /**
   * 違反の記録
   */
  private async recordViolation(req: Request, rule: RateLimitRule, limitResult: any): Promise<void> {
    const clientInfo = this.extractClientInfo(req);
    
    const violation: RateLimitViolation = {
      id: `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ipAddress: clientInfo.ip,
      userId: clientInfo.userId,
      userAgent: clientInfo.userAgent,
      endpoint: req.path,
      method: req.method,
      ruleId: rule.id,
      violationType: limitResult.violationType,
      requestCount: limitResult.currentCount,
      allowedCount: this.getAllowedCount(rule, limitResult.violationType),
      severity: this.calculateViolationSeverity(limitResult),
      actionTaken: this.determineAction(limitResult)
    };

    try {
      // データベースに記録
      await prisma.securityLog.create({
        data: {
          eventType: 'RATE_LIMIT_EXCEEDED',
          severity: violation.severity.toUpperCase() as any,
          ipAddress: violation.ipAddress,
          userAgent: violation.userAgent,
          userId: violation.userId,
          url: violation.endpoint,
          method: violation.method,
          detectionEngine: 'RATE_LIMITER',
          confidence: 100,
          riskScore: this.calculateRiskScore(violation),
          metadata: JSON.stringify({
            violationId: violation.id,
            ruleId: violation.ruleId,
            violationType: violation.violationType,
            requestCount: violation.requestCount,
            allowedCount: violation.allowedCount,
            actionTaken: violation.actionTaken
          }),
        },
      });

      // メトリクスの更新
      const key = `violations:${clientInfo.key}`;
      this.metrics.violationCounts.set(key, (this.metrics.violationCounts.get(key) || 0) + 1);

    } catch (error) {
      console.error('Failed to record rate limit violation:', error);
    }
  }

  /**
   * ユーティリティメソッド
   */
  private initializeDefaultRules(): void {
    const defaultRules: RateLimitRule[] = [
      {
        id: 'api_general',
        name: 'General API Rate Limit',
        pattern: '/api/',
        userType: 'all',
        limits: {
          requestsPerSecond: 10,
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          concurrentRequests: 20
        },
        burstCapacity: 20,
        enabled: true,
        priority: 1
      },
      {
        id: 'auth_endpoints',
        name: 'Authentication Endpoints',
        pattern: '/api/auth/',
        userType: 'all',
        limits: {
          requestsPerSecond: 2,
          requestsPerMinute: 10,
          requestsPerHour: 50,
          requestsPerDay: 200,
          concurrentRequests: 5
        },
        burstCapacity: 5,
        enabled: true,
        priority: 0
      },
      {
        id: 'anonymous_users',
        name: 'Anonymous Users',
        pattern: '.*',
        userType: 'anonymous',
        limits: {
          requestsPerSecond: 5,
          requestsPerMinute: 50,
          requestsPerHour: 500,
          requestsPerDay: 2000,
          concurrentRequests: 10
        },
        burstCapacity: 10,
        enabled: true,
        priority: 2
      },
      {
        id: 'premium_users',
        name: 'Premium Users',
        pattern: '.*',
        userType: 'premium',
        limits: {
          requestsPerSecond: 20,
          requestsPerMinute: 200,
          requestsPerHour: 2000,
          requestsPerDay: 50000,
          concurrentRequests: 50
        },
        burstCapacity: 50,
        enabled: true,
        priority: 3
      }
    ];

    this.config.rules = defaultRules;
  }

  private getApplicableRules(req: Request): RateLimitRule[] {
    const clientInfo = this.extractClientInfo(req);
    
    return this.config.rules
      .filter(rule => {
        if (!rule.enabled) return false;
        
        // URLパターンマッチング
        const pattern = typeof rule.pattern === 'string' 
          ? new RegExp(rule.pattern) 
          : rule.pattern;
        if (!pattern.test(req.path)) return false;
        
        // HTTPメソッドチェック
        if (rule.method && rule.method !== req.method) return false;
        
        // ユーザータイプチェック
        if (rule.userType && rule.userType !== 'all' && rule.userType !== clientInfo.userType) return false;
        
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private determineUserType(req: Request): string {
    const user = (req as any).user;
    if (!user) return 'anonymous';
    if (user.role === 'ADMIN') return 'admin';
    if (user.plan === 'premium') return 'premium';
    return 'authenticated';
  }

  private getClientIP(req: Request): string {
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.get('X-Real-IP') || req.connection.remoteAddress || 'unknown';
  }

  private isWhitelisted(clientInfo: any): boolean {
    return this.config.whitelist.ips.includes(clientInfo.ip) ||
           (clientInfo.userId && this.config.whitelist.userIds.includes(clientInfo.userId)) ||
           this.config.whitelist.userAgents.some(pattern => pattern.test(clientInfo.userAgent));
  }

  private isBlacklisted(clientInfo: any): boolean {
    return this.config.blacklist.ips.includes(clientInfo.ip) ||
           (clientInfo.userId && this.config.blacklist.userIds.includes(clientInfo.userId)) ||
           this.config.blacklist.userAgents.some(pattern => pattern.test(clientInfo.userAgent));
  }

  private rejectRequest(res: Response, reason: string, status: number = 403): void {
    res.status(status).json({
      error: 'Request Rejected',
      reason,
      timestamp: new Date().toISOString()
    });
  }

  private async getCurrentCounts(key: string): Promise<{
    second: number;
    minute: number;
    hour: number;
    day: number;
  }> {
    // 実装を簡略化（実際にはRedisなどを使用）
    const now = Date.now();
    
    return {
      second: this.getCountForPeriod(key, 'second', now),
      minute: this.getCountForPeriod(key, 'minute', now),
      hour: this.getCountForPeriod(key, 'hour', now),
      day: this.getCountForPeriod(key, 'day', now)
    };
  }

  private getCountForPeriod(key: string, period: string, now: number): number {
    const periodKey = `${key}:${period}`;
    const count = this.metrics.requestCounts.get(periodKey) || 0;
    const lastReset = this.metrics.lastReset.get(periodKey) || new Date(0);
    
    const windowMs = this.getPeriodMs(period);
    
    if (now - lastReset.getTime() > windowMs) {
      return 0;
    }
    
    return count;
  }

  private async incrementCounts(key: string): Promise<void> {
    const now = new Date();
    const periods = ['second', 'minute', 'hour', 'day'];
    
    for (const period of periods) {
      const periodKey = `${key}:${period}`;
      const windowMs = this.getPeriodMs(period);
      const lastReset = this.metrics.lastReset.get(periodKey) || new Date(0);
      
      if (now.getTime() - lastReset.getTime() > windowMs) {
        this.metrics.requestCounts.set(periodKey, 1);
        this.metrics.lastReset.set(periodKey, now);
      } else {
        this.metrics.requestCounts.set(periodKey, (this.metrics.requestCounts.get(periodKey) || 0) + 1);
      }
    }
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case 'second': return 1000;
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  }

  private getResetTime(period: string): Date {
    const now = new Date();
    const ms = this.getPeriodMs(period);
    return new Date(Math.ceil(now.getTime() / ms) * ms);
  }

  private trackConcurrentRequest(key: string, increment: boolean): void {
    const current = this.metrics.concurrentRequests.get(key) || 0;
    this.metrics.concurrentRequests.set(key, Math.max(0, current + (increment ? 1 : -1)));
  }

  private updateMetrics(req: Request, res: Response, clientInfo: any): void {
    // 学習データの更新
    const learningKey = `learning:${clientInfo.key}`;
    const learningData = this.adaptiveLearningData.get(learningKey) || [];
    learningData.push(Date.now());
    
    // 学習データを制限
    if (learningData.length > 1000) {
      learningData.splice(0, learningData.length - 1000);
    }
    
    this.adaptiveLearningData.set(learningKey, learningData);
  }

  private getAllowedCount(rule: RateLimitRule, violationType: string): number {
    switch (violationType) {
      case 'second_exceeded': return rule.limits.requestsPerSecond;
      case 'minute_exceeded': return rule.limits.requestsPerMinute;
      case 'hour_exceeded': return rule.limits.requestsPerHour;
      case 'day_exceeded': return rule.limits.requestsPerDay;
      case 'concurrent_exceeded': return rule.limits.concurrentRequests;
      case 'burst_exceeded': return rule.burstCapacity;
      default: return 0;
    }
  }

  private calculateViolationSeverity(limitResult: any): 'low' | 'medium' | 'high' | 'critical' {
    const overageRatio = limitResult.currentCount / limitResult.allowedCount;
    
    if (overageRatio > 10) return 'critical';
    if (overageRatio > 5) return 'high';
    if (overageRatio > 2) return 'medium';
    return 'low';
  }

  private determineAction(limitResult: any): 'warning' | 'temporary_block' | 'permanent_block' | 'captcha_required' {
    const overageRatio = limitResult.currentCount / limitResult.allowedCount;
    
    if (overageRatio > 20) return 'permanent_block';
    if (overageRatio > 10) return 'temporary_block';
    if (overageRatio > 5) return 'captcha_required';
    return 'warning';
  }

  private calculateRiskScore(violation: RateLimitViolation): number {
    let score = 0;
    
    switch (violation.severity) {
      case 'critical': score += 80; break;
      case 'high': score += 60; break;
      case 'medium': score += 40; break;
      case 'low': score += 20; break;
    }
    
    // 違反タイプによる追加スコア
    if (violation.violationType === 'concurrent_exceeded') score += 20;
    if (violation.violationType === 'burst_exceeded') score += 15;
    
    return Math.min(score, 100);
  }

  private async getRecentViolationCount(minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    
    try {
      const count = await prisma.securityLog.count({
        where: {
          eventType: 'RATE_LIMIT_EXCEEDED',
          detectedAt: {
            gte: since
          }
        }
      });
      
      return count;
    } catch (error) {
      console.error('Failed to get recent violation count:', error);
      return 0;
    }
  }

  private startPeriodicTasks(): void {
    // メトリクスのクリーンアップ
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 5 * 60 * 1000); // 5分ごと

    // 適応的学習データの更新
    setInterval(() => {
      this.updateAdaptiveThresholds();
    }, this.config.adaptiveThresholds.learningPeriod * 60 * 1000);
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24時間

    for (const [key, timestamp] of this.metrics.lastReset.entries()) {
      if (now - timestamp.getTime() > maxAge) {
        this.metrics.requestCounts.delete(key);
        this.metrics.lastReset.delete(key);
      }
    }
  }

  private updateAdaptiveThresholds(): void {
    if (!this.config.adaptiveThresholds.enabled) return;

    for (const [key, data] of this.adaptiveLearningData.entries()) {
      if (data.length < 10) continue;

      const recentData = data.slice(-100); // 最新100件
      const timeSpans = [];
      
      for (let i = 1; i < recentData.length; i++) {
        timeSpans.push(recentData[i] - recentData[i-1]);
      }

      if (timeSpans.length > 0) {
        const averageInterval = timeSpans.reduce((a, b) => a + b, 0) / timeSpans.length;
        const requestsPerMinute = Math.floor(60000 / averageInterval);
        
        this.metrics.adaptiveThresholds.set(key, requestsPerMinute);
      }
    }
  }

  /**
   * 公開メソッド
   */
  getMetrics(): any {
    return {
      totalRequests: Array.from(this.metrics.requestCounts.values()).reduce((a, b) => a + b, 0),
      totalViolations: Array.from(this.metrics.violationCounts.values()).reduce((a, b) => a + b, 0),
      concurrentRequests: Array.from(this.metrics.concurrentRequests.values()).reduce((a, b) => a + b, 0),
      emergencyModeActive: this.emergencyModeActive,
      adaptiveThresholds: Object.fromEntries(this.metrics.adaptiveThresholds),
      rules: this.config.rules.length
    };
  }

  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  addRule(rule: RateLimitRule): void {
    this.config.rules.push(rule);
    this.config.rules.sort((a, b) => a.priority - b.priority);
  }

  removeRule(ruleId: string): boolean {
    const index = this.config.rules.findIndex(rule => rule.id === ruleId);
    if (index === -1) return false;
    
    this.config.rules.splice(index, 1);
    return true;
  }

  updateRule(ruleId: string, updates: Partial<RateLimitRule>): boolean {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (!rule) return false;
    
    Object.assign(rule, updates);
    this.config.rules.sort((a, b) => a.priority - b.priority);
    return true;
  }
}

// シングルトンインスタンス
export const adaptiveRateLimiter = new AdaptiveRateLimiter();

export default AdaptiveRateLimiter;