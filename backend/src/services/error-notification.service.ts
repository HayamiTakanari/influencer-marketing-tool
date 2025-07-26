import nodemailer from 'nodemailer';
import { captureError } from '../config/sentry';

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
    immediate: string[]; // 即座に通知するエラーレベル
    batched: string[];   // バッチで通知するエラーレベル
    suppressed: string[]; // 通知を抑制するエラーレベル
  };
  rateLimit: {
    maxNotificationsPerHour: number;
    maxNotificationsPerDay: number;
    cooldownPeriod: number; // 同じエラーの連続通知を防ぐ期間（秒）
  };
  filters: {
    excludeEndpoints?: string[]; // 通知から除外するエンドポイント
    excludeUserAgents?: string[]; // 通知から除外するUserAgent
    excludeIPs?: string[]; // 通知から除外するIPアドレス
    includeOnlyEnvironments?: string[]; // 通知対象の環境
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

class ErrorNotificationService {
  private config: ErrorNotificationConfig;
  private notificationCounts: Map<string, { hourly: number; daily: number; lastReset: Date }>;
  private recentErrors: Map<string, Date>; // エラーの最後の通知時刻

  constructor() {
    this.config = {
      channels: [
        {
          name: 'email',
          enabled: Boolean(process.env.SMTP_HOST),
          config: {
            smtpHost: process.env.SMTP_HOST,
            smtpPort: Number(process.env.SMTP_PORT) || 587,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
            from: process.env.ERROR_NOTIFICATION_FROM || process.env.SMTP_USER,
            recipients: (process.env.ERROR_NOTIFICATION_RECIPIENTS || '').split(',').filter(Boolean),
          }
        },
        {
          name: 'slack',
          enabled: Boolean(process.env.SLACK_ERROR_WEBHOOK_URL),
          config: {
            webhookUrl: process.env.SLACK_ERROR_WEBHOOK_URL,
            channel: process.env.SLACK_ERROR_CHANNEL || '#errors',
            username: 'Error Bot',
          }
        },
        {
          name: 'webhook',
          enabled: Boolean(process.env.ERROR_WEBHOOK_URL),
          config: {
            url: process.env.ERROR_WEBHOOK_URL,
            secret: process.env.ERROR_WEBHOOK_SECRET,
          }
        }
      ],
      thresholds: {
        immediate: ['CRITICAL', 'HIGH'],
        batched: ['MEDIUM'],
        suppressed: ['LOW'],
      },
      rateLimit: {
        maxNotificationsPerHour: 10,
        maxNotificationsPerDay: 50,
        cooldownPeriod: 300, // 5分
      },
      filters: {
        excludeEndpoints: ['/health', '/favicon.ico'],
        excludeUserAgents: ['Googlebot', 'bingbot', 'Slackbot'],
        includeOnlyEnvironments: ['production', 'staging'],
      }
    };

    this.notificationCounts = new Map();
    this.recentErrors = new Map();
  }

  /**
   * エラー通知の送信
   */
  async sendErrorNotification(incident: ErrorIncident): Promise<void> {
    try {
      // フィルタリングチェック
      if (!this.shouldNotify(incident)) {
        return;
      }

      // レート制限チェック
      if (!this.checkRateLimit(incident)) {
        console.warn(`Rate limit exceeded for error notifications: ${incident.type}`);
        return;
      }

      // 重複通知の防止
      if (!this.checkCooldown(incident)) {
        console.warn(`Cooldown period active for error: ${incident.type}`);
        return;
      }

      // 即座に通知すべきかバッチ処理にするかを判定
      const shouldSendImmediate = this.config.thresholds.immediate.includes(incident.severity);

      if (shouldSendImmediate) {
        await this.sendImmediateNotification(incident);
      } else if (this.config.thresholds.batched.includes(incident.severity)) {
        await this.addToBatchQueue(incident);
      }

      // 通知カウントの更新
      this.updateNotificationCounts(incident);
      this.updateLastNotificationTime(incident);

    } catch (error) {
      console.error('Failed to send error notification:', error);
      captureError(error as Error, {
        tags: { category: 'notification', issue: 'send_failure' },
        level: 'warning'
      });
    }
  }

  /**
   * 即座に通知を送信
   */
  private async sendImmediateNotification(incident: ErrorIncident): Promise<void> {
    const promises = this.config.channels
      .filter(channel => channel.enabled)
      .map(channel => this.sendToChannel(channel, incident));

    await Promise.allSettled(promises);
  }

  /**
   * 指定されたチャンネルに通知を送信
   */
  private async sendToChannel(channel: NotificationChannel, incident: ErrorIncident): Promise<void> {
    try {
      switch (channel.name) {
        case 'email':
          await this.sendEmailNotification(incident, channel.config);
          break;
        case 'slack':
          await this.sendSlackNotification(incident, channel.config);
          break;
        case 'webhook':
          await this.sendWebhookNotification(incident, channel.config);
          break;
        default:
          console.warn(`Unknown notification channel: ${channel.name}`);
      }
    } catch (error) {
      console.error(`Failed to send notification to ${channel.name}:`, error);
    }
  }

  /**
   * メール通知の送信
   */
  private async sendEmailNotification(incident: ErrorIncident, config: any): Promise<void> {
    if (!config.recipients?.length) return;

    const transporter = nodemailer.createTransporter({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    const subject = `🚨 ${incident.severity} Error - ${incident.type} (${incident.environment})`;
    const htmlBody = this.createEmailBody(incident);

    await transporter.sendMail({
      from: config.from,
      to: config.recipients.join(','),
      subject,
      html: htmlBody,
    });

    console.log(`Error notification email sent for incident: ${incident.id}`);
  }

  /**
   * Slack通知の送信
   */
  private async sendSlackNotification(incident: ErrorIncident, config: any): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    
    const payload = {
      channel: config.channel,
      username: config.username,
      icon_emoji: this.getSeverityEmoji(incident.severity),
      attachments: [
        {
          color: this.getSeverityColor(incident.severity),
          title: `${incident.severity} Error: ${incident.type}`,
          fields: [
            {
              title: 'Environment',
              value: incident.environment,
              short: true,
            },
            {
              title: 'Endpoint',
              value: `${incident.method} ${incident.endpoint}`,
              short: true,
            },
            {
              title: 'User ID',
              value: incident.userId || 'Anonymous',
              short: true,
            },
            {
              title: 'IP Address',
              value: incident.ipAddress,
              short: true,
            },
            {
              title: 'Message',
              value: incident.message,
              short: false,
            },
            {
              title: 'Timestamp',
              value: incident.timestamp.toISOString(),
              short: true,
            },
          ],
          footer: 'Error Monitoring System',
          ts: Math.floor(incident.timestamp.getTime() / 1000),
        }
      ]
    };

    if (incident.sentryId) {
      payload.attachments[0].fields.push({
        title: 'Sentry ID',
        value: incident.sentryId,
        short: true,
      });
    }

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`Error notification sent to Slack for incident: ${incident.id}`);
  }

  /**
   * Webhook通知の送信
   */
  private async sendWebhookNotification(incident: ErrorIncident, config: any): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    const crypto = await import('crypto');

    const payload = JSON.stringify(incident);
    const headers: any = { 'Content-Type': 'application/json' };

    if (config.secret) {
      const signature = crypto
        .createHmac('sha256', config.secret)
        .update(payload)
        .digest('hex');
      headers['X-Signature'] = `sha256=${signature}`;
    }

    await fetch(config.url, {
      method: 'POST',
      headers,
      body: payload,
    });

    console.log(`Error notification sent to webhook for incident: ${incident.id}`);
  }

  /**
   * バッチキューへの追加
   */
  private async addToBatchQueue(incident: ErrorIncident): Promise<void> {
    // 実装例：Redis、データベース、またはin-memoryキュー
    console.log(`Added to batch queue: ${incident.id}`);
    // TODO: 実際のキュー実装
  }

  /**
   * 通知すべきかどうかの判定
   */
  private shouldNotify(incident: ErrorIncident): boolean {
    const { filters } = this.config;

    // 環境フィルタ
    if (filters.includeOnlyEnvironments?.length) {
      if (!filters.includeOnlyEnvironments.includes(incident.environment)) {
        return false;
      }
    }

    // エンドポイントフィルタ
    if (filters.excludeEndpoints?.some(endpoint => incident.endpoint.includes(endpoint))) {
      return false;
    }

    // UserAgentフィルタ
    if (incident.userAgent && filters.excludeUserAgents?.some(ua => incident.userAgent!.includes(ua))) {
      return false;
    }

    // IPアドレスフィルタ
    if (filters.excludeIPs?.includes(incident.ipAddress)) {
      return false;
    }

    // 抑制対象のセベリティレベル
    if (this.config.thresholds.suppressed.includes(incident.severity)) {
      return false;
    }

    return true;
  }

  /**
   * レート制限のチェック
   */
  private checkRateLimit(incident: ErrorIncident): boolean {
    const key = `${incident.environment}-${incident.type}`;
    const now = new Date();

    if (!this.notificationCounts.has(key)) {
      this.notificationCounts.set(key, {
        hourly: 0,
        daily: 0,
        lastReset: now,
      });
      return true;
    }

    const counts = this.notificationCounts.get(key)!;
    const hoursSinceReset = (now.getTime() - counts.lastReset.getTime()) / (1000 * 60 * 60);

    // 1時間ごとにリセット
    if (hoursSinceReset >= 1) {
      counts.hourly = 0;
      counts.lastReset = now;
    }

    // 24時間ごとにリセット
    if (hoursSinceReset >= 24) {
      counts.daily = 0;
    }

    return counts.hourly < this.config.rateLimit.maxNotificationsPerHour &&
           counts.daily < this.config.rateLimit.maxNotificationsPerDay;
  }

  /**
   * クールダウン期間のチェック
   */
  private checkCooldown(incident: ErrorIncident): boolean {
    const key = `${incident.type}-${incident.endpoint}`;
    const lastNotification = this.recentErrors.get(key);

    if (!lastNotification) return true;

    const timeSinceLastNotification = (Date.now() - lastNotification.getTime()) / 1000;
    return timeSinceLastNotification >= this.config.rateLimit.cooldownPeriod;
  }

  /**
   * 通知カウントの更新
   */
  private updateNotificationCounts(incident: ErrorIncident): void {
    const key = `${incident.environment}-${incident.type}`;
    const counts = this.notificationCounts.get(key);

    if (counts) {
      counts.hourly++;
      counts.daily++;
    }
  }

  /**
   * 最後の通知時刻の更新
   */
  private updateLastNotificationTime(incident: ErrorIncident): void {
    const key = `${incident.type}-${incident.endpoint}`;
    this.recentErrors.set(key, new Date());
  }

  /**
   * メール本文の作成
   */
  private createEmailBody(incident: ErrorIncident): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: ${this.getSeverityColor(incident.severity)}; margin-top: 0;">
              🚨 ${incident.severity} Error Alert
            </h2>
            
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3>Error Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="font-weight: bold; padding: 5px;">Type:</td><td style="padding: 5px;">${incident.type}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">Message:</td><td style="padding: 5px;">${incident.message}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">Environment:</td><td style="padding: 5px;">${incident.environment}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">Endpoint:</td><td style="padding: 5px;">${incident.method} ${incident.endpoint}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">User ID:</td><td style="padding: 5px;">${incident.userId || 'Anonymous'}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">IP Address:</td><td style="padding: 5px;">${incident.ipAddress}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px;">Timestamp:</td><td style="padding: 5px;">${incident.timestamp.toISOString()}</td></tr>
                ${incident.sentryId ? `<tr><td style="font-weight: bold; padding: 5px;">Sentry ID:</td><td style="padding: 5px;">${incident.sentryId}</td></tr>` : ''}
              </table>
            </div>

            ${incident.stack ? `
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3>Stack Trace</h3>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${incident.stack}</pre>
            </div>
            ` : ''}

            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3>Context</h3>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(incident.context, null, 2)}</pre>
            </div>

            <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
              This is an automated error notification from the Influencer Marketing Tool monitoring system.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * セベリティに応じた色を取得
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      'LOW': '#28a745',
      'MEDIUM': '#ffc107',
      'HIGH': '#fd7e14',
      'CRITICAL': '#dc3545'
    };
    return colors[severity as keyof typeof colors] || '#6c757d';
  }

  /**
   * セベリティに応じた絵文字を取得
   */
  private getSeverityEmoji(severity: string): string {
    const emojis = {
      'LOW': ':information_source:',
      'MEDIUM': ':warning:',
      'HIGH': ':exclamation:',
      'CRITICAL': ':rotating_light:'
    };
    return emojis[severity as keyof typeof emojis] || ':question:';
  }

  /**
   * バッチ処理（定期実行用）
   */
  async processBatchNotifications(): Promise<void> {
    // TODO: バッチキューからアイテムを取得して一括送信
    console.log('Processing batch notifications...');
  }
}

// シングルトンインスタンス
export const errorNotificationService = new ErrorNotificationService();

export default ErrorNotificationService;