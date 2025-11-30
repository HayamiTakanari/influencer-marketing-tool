import { RequestLogData } from '../middleware/request-logger';
/**
 * 異常パターン検出エンジン
 * 複数の検知手法を組み合わせてリアルタイム異常検知を実行
 */
export declare enum AnomalyType {
    RATE_LIMIT_VIOLATION = "rate_limit_violation",
    SUSPICIOUS_USER_AGENT = "suspicious_user_agent",
    SQL_INJECTION = "sql_injection",
    XSS_ATTEMPT = "xss_attempt",
    COMMAND_INJECTION = "command_injection",
    PATH_TRAVERSAL = "path_traversal",
    BRUTE_FORCE = "brute_force",
    SCANNER_ACTIVITY = "scanner_activity",
    UNUSUAL_GEOGRAPHIC_ACCESS = "unusual_geographic_access",
    SUSPICIOUS_API_USAGE = "suspicious_api_usage",
    LARGE_PAYLOAD = "large_payload",
    REPEATED_404_ERRORS = "repeated_404_errors",
    SESSION_ANOMALY = "session_anomaly",
    TIMESTAMP_MANIPULATION = "timestamp_manipulation",
    BOT_ACTIVITY = "bot_activity"
}
export declare enum ThreatLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface AnomalyDetection {
    id: string;
    type: AnomalyType;
    threatLevel: ThreatLevel;
    confidence: number;
    timestamp: Date;
    ipAddress: string;
    userAgent?: string;
    userId?: string;
    endpoint: string;
    description: string;
    evidence: Record<string, any>;
    riskScore: number;
    actionTaken?: string;
}
export interface DetectionRule {
    id: string;
    name: string;
    type: AnomalyType;
    enabled: boolean;
    threshold: number;
    timeWindow: number;
    pattern?: RegExp;
    customLogic?: (logData: RequestLogData) => Promise<boolean>;
    severity: ThreatLevel;
}
export interface AnomalyStats {
    totalDetections: number;
    detectionsByType: Record<AnomalyType, number>;
    detectionsByThreatLevel: Record<ThreatLevel, number>;
    topAttackerIPs: Array<{
        ip: string;
        count: number;
    }>;
    recentDetections: AnomalyDetection[];
    trendsLastHour: number;
    trendsLastDay: number;
}
declare class AnomalyDetectionService {
    private detectionRules;
    private recentActivity;
    private geoCache;
    private detectionHistory;
    constructor();
    /**
     * リクエストログを分析して異常を検知
     */
    detectAnomalies(logData: RequestLogData): Promise<AnomalyDetection[]>;
    /**
     * レート制限違反の検知
     */
    private checkRateLimit;
    /**
     * 疑わしいUser-Agentの検知
     */
    private checkSuspiciousUserAgent;
    /**
     * SQLインジェクション攻撃の検知
     */
    private checkSQLInjection;
    /**
     * XSS攻撃の検知
     */
    private checkXSSAttempt;
    /**
     * コマンドインジェクション攻撃の検知
     */
    private checkCommandInjection;
    /**
     * パストラバーサル攻撃の検知
     */
    private checkPathTraversal;
    /**
     * ブルートフォース攻撃の検知
     */
    private checkBruteForce;
    /**
     * スキャナー活動の検知
     */
    private checkScannerActivity;
    /**
     * その他の検知メソッド（簡略化）
     */
    private checkUnusualGeographicAccess;
    private checkSuspiciousAPIUsage;
    private checkLargePayload;
    private checkRepeated404Errors;
    private checkBotActivity;
    /**
     * ヘルパーメソッド
     */
    private isAllowedBot;
    private createDetection;
    private calculateConfidence;
    private generateDescription;
    private calculateRiskScore;
    /**
     * 初期化とユーティリティメソッド
     */
    private initializeDefaultRules;
    private recordDetections;
    private mapAnomalyTypeToSecurityEvent;
    private updateDetectionHistory;
    private startPeriodicCleanup;
    /**
     * 公開メソッド
     */
    getDetectionHistory(): AnomalyDetection[];
    getDetectionRules(): DetectionRule[];
    updateDetectionRule(ruleId: string, updates: Partial<DetectionRule>): boolean;
    addDetectionRule(rule: DetectionRule): void;
    removeDetectionRule(ruleId: string): boolean;
}
export declare const anomalyDetectionService: AnomalyDetectionService;
export default AnomalyDetectionService;
//# sourceMappingURL=anomaly-detection.service.d.ts.map