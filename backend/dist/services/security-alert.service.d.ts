import { XSSRiskLevel } from '../utils/xss-detection-engine';
/**
 * セキュリティアラート・通知サービス
 * Slack、メール、Webhook等への通知機能を提供
 */
interface SecurityIncident {
    id: string;
    type: 'XSS_ATTACK' | 'SQL_INJECTION' | 'BRUTE_FORCE' | 'SUSPICIOUS_ACTIVITY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: Date;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    url: string;
    method: string;
    details: any;
    resolved: boolean;
}
declare class SecurityAlertService {
    private alertConfig;
    private alertCounts;
    constructor();
    /**
     * XSS攻撃アラートの送信
     */
    sendXSSAttackAlert(incident: {
        userId?: string;
        ipAddress: string;
        userAgent: string;
        url: string;
        method: string;
        riskLevel: XSSRiskLevel;
        confidence: number;
        detectedPatterns: string[];
        matchedPayloads: string[];
        inputSample: string;
    }): Promise<void>;
    /**
     * 複数攻撃の一括アラート
     */
    sendBatchAlert(incidents: SecurityIncident[]): Promise<void>;
    /**
     * 緊急アラートの送信
     */
    sendCriticalAlert(incident: SecurityIncident): Promise<void>;
    /**
     * メインのアラート処理
     */
    private processAlert;
    /**
     * Slack通知の送信
     */
    private sendSlackCriticalAlert;
    /**
     * Slackバッチアラート
     */
    private sendSlackBatchAlert;
    /**
     * メール通知の送信
     */
    private sendEmailCriticalAlert;
    /**
     * Webhook通知の送信
     */
    private sendWebhookCriticalAlert;
    /**
     * ユーティリティメソッド
     */
    private mapRiskLevelToSeverity;
    private generateIncidentId;
    private getSeverityColor;
    private formatIncidentDetails;
    private createEmailBody;
    private createBatchSummary;
    private getMostFrequent;
    private checkRateLimit;
    private updateAlertCounts;
    private addToBatchQueue;
    private saveIncident;
    processBatchAlerts(): Promise<void>;
    private sendEmailBatchAlert;
    private sendWebhookBatchAlert;
}
export declare const securityAlertService: SecurityAlertService;
export default SecurityAlertService;
//# sourceMappingURL=security-alert.service.d.ts.map