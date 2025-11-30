/**
 * IP ブラックリスト管理サービス
 * 自動・手動でのIPブラックリスト管理とインテリジェントな検知
 */
export declare enum BlacklistReason {
    MANUAL_BLOCK = "manual_block",
    RATE_LIMIT_VIOLATION = "rate_limit_violation",
    SECURITY_VIOLATION = "security_violation",
    MALICIOUS_ACTIVITY = "malicious_activity",
    BRUTE_FORCE_ATTACK = "brute_force_attack",
    SCANNER_ACTIVITY = "scanner_activity",
    SPAM_ACTIVITY = "spam_activity",
    GEOGRAPHICAL_RESTRICTION = "geographical_restriction",
    REPUTATION_BASED = "reputation_based",
    AUTOMATED_DETECTION = "automated_detection"
}
export declare enum BlacklistSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface BlacklistEntry {
    id: string;
    ipAddress: string;
    cidr?: string;
    reason: BlacklistReason;
    severity: BlacklistSeverity;
    firstDetected: Date;
    lastActivity: Date;
    attackCount: number;
    blockedRequests: number;
    isActive: boolean;
    expiresAt?: Date;
    permanent: boolean;
    geoLocation?: {
        country?: string;
        region?: string;
        asn?: string;
        isp?: string;
    };
    addedBy?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BlacklistRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    severity: BlacklistSeverity;
    autoBlockThreshold: number;
    timeWindow: number;
    conditions: {
        rateLimitViolations?: number;
        securityViolations?: number;
        attackPatterns?: string[];
        geoRestrictions?: string[];
        reputationThreshold?: number;
    };
    blockDuration?: number;
    escalation: {
        enabled: boolean;
        escalationThreshold: number;
        escalationSeverity: BlacklistSeverity;
    };
}
export interface BlacklistStats {
    totalBlacklisted: number;
    activeBlacklisted: number;
    recentlyAdded: number;
    topCountries: Array<{
        country: string;
        count: number;
    }>;
    reasonBreakdown: Record<BlacklistReason, number>;
    severityBreakdown: Record<BlacklistSeverity, number>;
    blockedRequestsToday: number;
    falsePositiveRate: number;
}
export interface GeoThreatIntelligence {
    country: string;
    riskScore: number;
    threatCategories: string[];
    lastUpdated: Date;
}
declare class IPBlacklistService {
    private blacklistRules;
    private geoThreatIntel;
    private reputationCache;
    constructor();
    /**
     * IPアドレスのブラックリストチェック
     */
    isBlacklisted(ipAddress: string): Promise<{
        isBlacklisted: boolean;
        entry?: BlacklistEntry;
        reason?: string;
    }>;
    /**
     * IPアドレスのブラックリストへの追加
     */
    addToBlacklist(params: {
        ipAddress: string;
        reason: BlacklistReason;
        severity: BlacklistSeverity;
        duration?: number;
        permanent?: boolean;
        notes?: string;
        addedBy?: string;
        geoLocation?: any;
    }): Promise<BlacklistEntry>;
    /**
     * 自動ブラックリスト判定
     */
    evaluateForAutoBlacklist(ipAddress: string, violationData: {
        type: string;
        severity: string;
        timestamp: Date;
        details?: any;
    }): Promise<boolean>;
    /**
     * 地理的脅威インテリジェンスの評価
     */
    evaluateGeoThreat(ipAddress: string, geoLocation: any): Promise<{
        shouldBlock: boolean;
        riskScore: number;
        reason?: string;
    }>;
    /**
     * レピュテーションベースの評価
     */
    evaluateReputation(ipAddress: string): Promise<{
        shouldBlock: boolean;
        reputationScore: number;
        sources: string[];
    }>;
    /**
     * ブラックリストからの削除
     */
    removeFromBlacklist(ipAddress: string, reason?: string, removedBy?: string): Promise<boolean>;
    /**
     * 期限切れエントリのクリーンアップ
     */
    cleanupExpiredEntries(): Promise<number>;
    /**
     * ブラックリスト統計の取得
     */
    getBlacklistStats(): Promise<BlacklistStats>;
    /**
     * ヘルパーメソッド
     */
    private initializeDefaultRules;
    private getApplicableRules;
    private ruleMatchesViolation;
    private checkAutoBlockCriteria;
    private mapViolationTypeToReason;
    private updateLastActivity;
    private updateBlacklistEntry;
    private mapPrismaToBlacklistEntry;
    private notifyBlacklistAddition;
    private fetchGeoThreatIntel;
    private checkAbuseIPDB;
    private checkVirusTotalReputation;
    private checkGreyNoiseReputation;
    private checkOwnReputation;
    private getTopCountries;
    private getReasonBreakdown;
    private getSeverityBreakdown;
    private getBlockedRequestsToday;
    private calculateFalsePositiveRate;
    private startPeriodicTasks;
    private updateGeoThreatIntel;
    /**
     * 公開メソッド
     */
    getBlacklistRules(): BlacklistRule[];
    updateRule(ruleId: string, updates: Partial<BlacklistRule>): boolean;
    addRule(rule: BlacklistRule): void;
    removeRule(ruleId: string): boolean;
    getBlacklistedIPs(params?: {
        page?: number;
        limit?: number;
        severity?: BlacklistSeverity;
        reason?: BlacklistReason;
        activeOnly?: boolean;
    }): Promise<{
        entries: BlacklistEntry[];
        total: number;
    }>;
}
export declare const ipBlacklistService: IPBlacklistService;
export default IPBlacklistService;
//# sourceMappingURL=ip-blacklist.service.d.ts.map