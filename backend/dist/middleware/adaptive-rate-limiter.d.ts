import { Request, Response, NextFunction } from 'express';
/**
 * 適応的レート制限ミドルウェア
 * 動的な閾値調整とインテリジェントなレート制限を実現
 */
export interface RateLimitRule {
    id: string;
    name: string;
    pattern: string | RegExp;
    method?: string;
    userType?: 'anonymous' | 'authenticated' | 'premium' | 'admin' | 'all';
    limits: {
        requestsPerSecond: number;
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        concurrentRequests: number;
    };
    burstCapacity: number;
    enabled: boolean;
    priority: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    onLimitReached?: (req: Request, res: Response) => void;
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
        learningPeriod: number;
        adjustmentFactor: number;
        minThreshold: number;
        maxThreshold: number;
    };
    emergencyMode: {
        enabled: boolean;
        triggerThreshold: number;
        restrictionLevel: number;
        duration: number;
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
declare class AdaptiveRateLimiter {
    private config;
    private metrics;
    private emergencyModeActive;
    private emergencyModeEndTime?;
    private adaptiveLearningData;
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * メインのレート制限ミドルウェア
     */
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * クライアント情報の抽出
     */
    private extractClientInfo;
    /**
     * レート制限チェック
     */
    private checkRateLimit;
    /**
     * 適応的閾値の計算
     */
    private getAdaptiveThresholds;
    /**
     * バーストキャパシティチェック
     */
    private checkBurstCapacity;
    /**
     * 緊急モードの確認
     */
    private checkEmergencyMode;
    /**
     * 緊急モードの発動
     */
    private activateEmergencyMode;
    /**
     * レート制限違反の処理
     */
    private handleRateLimitViolation;
    /**
     * 違反の記録
     */
    private recordViolation;
    /**
     * ユーティリティメソッド
     */
    private initializeDefaultRules;
    private getApplicableRules;
    private determineUserType;
    private getClientIP;
    private isWhitelisted;
    private isBlacklisted;
    private rejectRequest;
    private getCurrentCounts;
    private getCountForPeriod;
    private incrementCounts;
    private getPeriodMs;
    private getResetTime;
    private trackConcurrentRequest;
    private updateMetrics;
    private getAllowedCount;
    private calculateViolationSeverity;
    private determineAction;
    private calculateRiskScore;
    private getRecentViolationCount;
    private startPeriodicTasks;
    private cleanupOldMetrics;
    private updateAdaptiveThresholds;
    /**
     * 公開メソッド
     */
    getMetrics(): any;
    updateConfig(newConfig: Partial<RateLimitConfig>): void;
    addRule(rule: RateLimitRule): void;
    removeRule(ruleId: string): boolean;
    updateRule(ruleId: string, updates: Partial<RateLimitRule>): boolean;
}
export declare const adaptiveRateLimiter: AdaptiveRateLimiter;
export default AdaptiveRateLimiter;
//# sourceMappingURL=adaptive-rate-limiter.d.ts.map