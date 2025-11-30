/**
 * エラー通知サービス
 * 重要なエラーをメール、Slack、Webhookで即座に通知
 */
export interface NotificationChannel {
    name: string;
    enabled: boolean;
    config: any;
}
export interface ErrorNotificationConfig {
    channels: NotificationChannel[];
    thresholds: {
        immediate: string[];
        batched: string[];
        suppressed: string[];
    };
    rateLimit: {
        maxNotificationsPerHour: number;
        maxNotificationsPerDay: number;
        cooldownPeriod: number;
    };
    filters: {
        excludeEndpoints?: string[];
        excludeUserAgents?: string[];
        excludeIPs?: string[];
        includeOnlyEnvironments?: string[];
    };
}
export interface ErrorIncident {
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    stack?: string;
    timestamp: Date;
    environment: string;
    userId?: string;
    ipAddress: string;
    userAgent?: string;
    endpoint: string;
    method: string;
    context: Record<string, any>;
    sentryId?: string;
}
declare class ErrorNotificationService {
    private config;
    private notificationCounts;
    private recentErrors;
    constructor();
    /**
     * エラー通知の送信
     */
    sendErrorNotification(incident: ErrorIncident): Promise<void>;
    /**
     * 即座に通知を送信
     */
    private sendImmediateNotification;
    /**
     * 指定されたチャンネルに通知を送信
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
     * バッチキューへの追加
     */
    private addToBatchQueue;
    /**
     * 通知すべきかどうかの判定
     */
    private shouldNotify;
    /**
     * レート制限のチェック
     */
    private checkRateLimit;
    /**
     * クールダウン期間のチェック
     */
    private checkCooldown;
    /**
     * 通知カウントの更新
     */
    private updateNotificationCounts;
    /**
     * 最後の通知時刻の更新
     */
    private updateLastNotificationTime;
    /**
     * メール本文の作成
     */
    private createEmailBody;
    /**
     * セベリティに応じた色を取得
     */
    private getSeverityColor;
    /**
     * セベリティに応じた絵文字を取得
     */
    private getSeverityEmoji;
    /**
     * バッチ処理（定期実行用）
     */
    processBatchNotifications(): Promise<void>;
}
export declare const errorNotificationService: ErrorNotificationService;
export default ErrorNotificationService;
//# sourceMappingURL=error-notification.service.d.ts.map