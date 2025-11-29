import { SecurityThreat } from './realtime-security-notification.service';
import { SecurityAnalysisResult } from './security-orchestrator.service';
/**
 * セキュリティログ記録・分析サービス
 * 全ての検知イベントを記録し、高度な分析・レポート機能を提供
 */
export interface SecurityLogEntry {
    id: string;
    timestamp: Date;
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    source: string;
    ipAddress: string;
    userAgent?: string;
    userId?: string;
    endpoint: string;
    method: string;
    statusCode?: number;
    payload?: string;
    detectionEngine: string;
    confidence: number;
    riskScore: number;
    geoLocation?: {
        country?: string;
        region?: string;
        city?: string;
        asn?: string;
        isp?: string;
    };
    metadata: Record<string, any>;
    tags: string[];
    isResolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    falsePositive: boolean;
    notes?: string;
}
export declare enum SecurityEventType {
    SQL_INJECTION = "SQL_INJECTION",
    XSS_ATTACK = "XSS_ATTACK",
    COMMAND_INJECTION = "COMMAND_INJECTION",
    PATH_TRAVERSAL = "PATH_TRAVERSAL",
    BRUTE_FORCE = "BRUTE_FORCE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE",
    AUTHORIZATION_FAILURE = "AUTHORIZATION_FAILURE",
    BLACKLIST_HIT = "BLACKLIST_HIT",
    ANOMALY_DETECTED = "ANOMALY_DETECTED",
    PATTERN_MATCHED = "PATTERN_MATCHED",
    COORDINATED_ATTACK = "COORDINATED_ATTACK",
    BOT_ACTIVITY = "BOT_ACTIVITY",
    SCANNER_ACTIVITY = "SCANNER_ACTIVITY",
    DATA_EXFILTRATION = "DATA_EXFILTRATION",
    PRIVILEGE_ESCALATION = "PRIVILEGE_ESCALATION",
    MALWARE_DETECTED = "MALWARE_DETECTED",
    PHISHING_ATTEMPT = "PHISHING_ATTEMPT",
    DDoS_ATTACK = "DDoS_ATTACK"
}
export declare enum SecuritySeverity {
    INFO = "INFO",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface SecurityAnalytics {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    topSourceIPs: Array<{
        ip: string;
        count: number;
        avgRisk: number;
        country?: string;
    }>;
    topUserAgents: Array<{
        userAgent: string;
        count: number;
        avgRisk: number;
    }>;
    topEndpoints: Array<{
        endpoint: string;
        count: number;
        avgRisk: number;
    }>;
    topUsers: Array<{
        userId: string;
        count: number;
        avgRisk: number;
    }>;
    geographicalDistribution: Array<{
        country: string;
        count: number;
        avgRisk: number;
    }>;
    timeSeriesData: Array<{
        timestamp: Date;
        count: number;
        avgRisk: number;
    }>;
    detectionEnginePerformance: Array<{
        engine: string;
        count: number;
        falsePositiveRate: number;
    }>;
    trendsAndPatterns: {
        hourlyDistribution: number[];
        dailyDistribution: number[];
        weeklyTrends: Array<{
            week: string;
            count: number;
            avgRisk: number;
        }>;
        emergingThreats: Array<{
            type: string;
            growth: number;
            recentCount: number;
        }>;
    };
}
export interface LogSearchOptions {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: SecurityEventType[];
    severities?: SecuritySeverity[];
    sources?: string[];
    ipAddresses?: string[];
    userIds?: string[];
    endpoints?: string[];
    detectionEngines?: string[];
    riskScoreMin?: number;
    riskScoreMax?: number;
    confidenceMin?: number;
    confidenceMax?: number;
    countries?: string[];
    tags?: string[];
    isResolved?: boolean;
    falsePositive?: boolean;
    searchQuery?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'riskScore' | 'confidence' | 'severity';
    sortOrder?: 'asc' | 'desc';
}
export interface LogExportOptions {
    format: 'json' | 'csv' | 'elasticsearch' | 'splunk';
    compression?: boolean;
    includeMetadata?: boolean;
    timeRange: {
        start: Date;
        end: Date;
    };
    filters?: LogSearchOptions;
}
export interface ThreatTrend {
    threatType: SecurityEventType;
    period: 'hour' | 'day' | 'week' | 'month';
    data: Array<{
        timestamp: Date;
        count: number;
        avgRiskScore: number;
        uniqueIPs: number;
    }>;
    growthRate: number;
    forecast: Array<{
        timestamp: Date;
        predictedCount: number;
        confidenceInterval: [number, number];
    }>;
}
declare class SecurityLogAnalysisService {
    private logBuffer;
    private analyticsCache;
    private readonly BUFFER_SIZE;
    private readonly CACHE_TTL;
    constructor();
    /**
     * セキュリティイベントの記録
     */
    logSecurityEvent(eventData: {
        eventType: SecurityEventType;
        severity: SecuritySeverity;
        source: string;
        ipAddress: string;
        userAgent?: string;
        userId?: string;
        endpoint: string;
        method: string;
        statusCode?: number;
        payload?: string;
        detectionEngine: string;
        confidence: number;
        riskScore: number;
        geoLocation?: any;
        metadata: Record<string, any>;
        tags?: string[];
    }): Promise<SecurityLogEntry>;
    /**
     * セキュリティ脅威の一括記録
     */
    logSecurityThreat(threat: SecurityThreat): Promise<SecurityLogEntry>;
    /**
     * セキュリティ分析結果の記録
     */
    logAnalysisResult(result: SecurityAnalysisResult): Promise<SecurityLogEntry[]>;
    /**
     * ログ検索
     */
    searchLogs(options?: LogSearchOptions): Promise<{
        logs: SecurityLogEntry[];
        total: number;
        aggregations: {
            eventTypes: Record<string, number>;
            severities: Record<string, number>;
            sources: Record<string, number>;
        };
    }>;
    /**
     * セキュリティ分析の実行
     */
    generateAnalytics(startDate?: Date, endDate?: Date): Promise<SecurityAnalytics>;
    /**
     * 脅威トレンド分析
     */
    analyzeThreatTrends(threatType: SecurityEventType, period?: 'hour' | 'day' | 'week' | 'month', lookbackDays?: number): Promise<ThreatTrend>;
    /**
     * ログのエクスポート
     */
    exportLogs(options: LogExportOptions): Promise<string>;
    /**
     * ログエントリの解決
     */
    resolveLogEntry(logId: string, resolvedBy: string, notes?: string, falsePositive?: boolean): Promise<boolean>;
    /**
     * プライベートメソッド
     */
    private persistLogEntry;
    private flushLogBuffer;
    private performRealtimeAnalysis;
    private analyzeSequentialPatterns;
    private forwardToExternalSystems;
    private sendToElasticsearch;
    private sendToSplunk;
    private sendToDatadog;
    private getEventTypeStatistics;
    private getSeverityStatistics;
    private getTopSourceIPs;
    private getTopUserAgents;
    private getTopEndpoints;
    private getTopUsers;
    private getGeographicalStatistics;
    private getTimeSeriesData;
    private getDetectionEnginePerformance;
    private getTrendsAndPatterns;
    private getThreatTimeSeriesData;
    private calculateGrowthRate;
    private generateForecast;
    private calculateTrend;
    private exportAsJSON;
    private exportAsCSV;
    private exportAsElasticsearch;
    private exportAsSplunk;
    private mapThreatTypeToEventType;
    private mapNotificationSeverityToSecuritySeverity;
    private mapRiskLevelToSecuritySeverity;
    private mapPrismaToLogEntry;
    private generateLogId;
    private startPeriodicTasks;
    private cleanupCache;
    private archiveOldLogs;
    /**
     * 公開メソッド
     */
    getLogBufferStatus(): {
        size: number;
        maxSize: number;
    };
    getSystemStats(): Promise<{
        totalLogs: number;
        logsToday: number;
        avgRiskScore: number;
        topThreats: Array<{
            type: string;
            count: number;
        }>;
    }>;
}
export declare const securityLogAnalysisService: SecurityLogAnalysisService;
export default SecurityLogAnalysisService;
//# sourceMappingURL=security-log-analysis.service.d.ts.map