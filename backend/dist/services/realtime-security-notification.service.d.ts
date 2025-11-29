import { AnomalyDetection } from './anomaly-detection.service';
import { DetectionResult } from './pattern-detection.service';
import { RateLimitViolation } from '../middleware/adaptive-rate-limiter';
import { BlacklistEntry } from './ip-blacklist.service';
/**
 * リアルタイムセキュリティ通知サービス
 * 全ての検知システムからの脅威を統合し、即座に管理者に通知
 */
export declare enum NotificationSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export declare enum NotificationChannel {
    EMAIL = "email",
    SLACK = "slack",
    WEBHOOK = "webhook",
    SMS = "sms",
    TEAMS = "teams"
}
export interface SecurityThreat {
    id: string;
    timestamp: Date;
    severity: NotificationSeverity;
    category: 'anomaly' | 'pattern' | 'rate_limit' | 'blacklist' | 'multiple';
    source: string;
    threatType: string;
    ipAddress: string;
    userAgent?: string;
    userId?: string;
    endpoint: string;
    description: string;
    evidence: Record<string, any>;
    riskScore: number;
    confidence: number;
    geoLocation?: {
        country?: string;
        region?: string;
        city?: string;
    };
    attackVectors: string[];
    recommendedActions: string[];
    escalationLevel: number;
}
export interface NotificationRule {
    id: string;
    name: string;
    enabled: boolean;
    channels: NotificationChannel[];
    severity: NotificationSeverity[];
    categories: string[];
    conditions: {
        riskScoreThreshold: number;
        confidenceThreshold: number;
        escalationLevelThreshold: number;
        geoLocationFilter?: string[];
        attackTypeFilter?: string[];
        ipRangeFilter?: string[];
        timeWindowMinutes?: number;
    };
    rateLimit: {
        maxNotificationsPerHour: number;
        maxNotificationsPerDay: number;
        cooldownMinutes: number;
    };
    escalation: {
        enabled: boolean;
        escalateAfterCount: number;
        escalateAfterMinutes: number;
        escalationChannels: NotificationChannel[];
    };
}
export interface SecurityDashboard {
    activeThreats: number;
    threatsLast24h: number;
    topAttackTypes: Array<{
        type: string;
        count: number;
    }>;
    topSourceIPs: Array<{
        ip: string;
        count: number;
        country?: string;
    }>;
    severityBreakdown: Record<NotificationSeverity, number>;
    alertChannelStatus: Record<NotificationChannel, boolean>;
    systemHealth: {
        detectionEngines: Array<{
            name: string;
            status: 'online' | 'offline' | 'degraded';
        }>;
        lastProcessedAt: Date;
        avgResponseTime: number;
    };
}
declare class RealtimeSecurityNotificationService {
    private notificationRules;
    private threatHistory;
    private channelConfigs;
    private notificationCounts;
    private activeThreats;
    private escalationTracking;
    constructor();
    /**
     * 異常検知からの脅威通知
     */
    notifyAnomalyDetection(detection: AnomalyDetection): Promise<void>;
    /**
     * パターン検知からの脅威通知
     */
    notifyPatternDetection(detection: DetectionResult): Promise<void>;
    /**
     * レート制限違反からの脅威通知
     */
    notifyRateLimitViolation(violation: RateLimitViolation): Promise<void>;
    /**
     * ブラックリスト追加からの脅威通知
     */
    notifyBlacklistAddition(entry: BlacklistEntry): Promise<void>;
    /**
     * 複合脅威の通知（複数の検知エンジンで同じIPが検出された場合）
     */
    notifyCompositeThreats(ipAddress: string, threats: SecurityThreat[]): Promise<void>;
    /**
     * メインの脅威処理ロジック
     */
    private processThreatNotification;
    /**
     * 通知の送信
     */
    private sendNotifications;
    /**
     * チャンネル別通知送信
     */
    private sendToChannel;
    /**
     * メール通知の送信
     */
    private sendEmailNotification;
    /**
     * Slack通知の送信
     */
    private sendSlackNotification;
    /**
     * Webhook通知の送信
     */
    private sendWebhookNotification;
    /**
     * Teams通知の送信
     */
    private sendTeamsNotification;
    /**
     * SMS通知の送信
     */
    private sendSMSNotification;
    /**
     * ダッシュボード情報の取得
     */
    getSecurityDashboard(): Promise<SecurityDashboard>;
    /**
     * 初期化とヘルパーメソッド
     */
    private initializeNotificationRules;
    private initializeChannelConfigs;
    private storeThreat;
    private checkForCompositeThreats;
    private getApplicableRules;
    private shouldNotify;
    private updateNotificationCounts;
    private checkEscalation;
    private sendEscalationNotifications;
    private updateActiveThreats;
    private startPeriodicTasks;
    private cleanupExpiredData;
    private analyzeCompositeThreats;
    /**
     * ヘルパーメソッド
     */
    private generateThreatId;
    private mapThreatLevelToSeverity;
    private mapRiskScoreToSeverity;
    private mapViolationSeverityToNotificationSeverity;
    private mapBlacklistSeverityToNotificationSeverity;
    private calculateRiskScoreFromViolation;
    private calculateRiskScoreFromBlacklist;
    private generateRecommendedActions;
    private generateRateLimitActions;
    private generateBlacklistActions;
    private generateEmailSubject;
    private generateEmailBody;
    private getSeverityColor;
    private getSeverityEmoji;
    private mapThreatTypeToEventType;
    /**
     * 公開メソッド
     */
    getNotificationRules(): NotificationRule[];
    updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): boolean;
    addNotificationRule(rule: NotificationRule): void;
    removeNotificationRule(ruleId: string): boolean;
    testNotificationChannel(channel: NotificationChannel): Promise<boolean>;
}
export declare const realtimeSecurityNotificationService: RealtimeSecurityNotificationService;
export default RealtimeSecurityNotificationService;
//# sourceMappingURL=realtime-security-notification.service.d.ts.map