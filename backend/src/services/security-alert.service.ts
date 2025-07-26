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

interface AlertChannel {
  name: string;
  enabled: boolean;
  config: any;
}

interface AlertConfig {
  channels: AlertChannel[];
  thresholds: {
    immediate: string[]; // 即座に通知するセキュリティレベル
    batched: string[];   // バッチで通知するセキュリティレベル
  };
  rateLimit: {
    maxAlertsPerHour: number;
    maxAlertsPerDay: number;
  };
}

class SecurityAlertService {
  private alertConfig: AlertConfig;
  private alertCounts: Map<string, { hourly: number; daily: number; lastReset: Date }>;

  constructor() {
    this.alertConfig = {
      channels: [
        {
          name: 'slack',
          enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
          config: {
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: process.env.SLACK_SECURITY_CHANNEL || '#security-alerts',
            username: 'Security Bot'
          }
        },
        {
          name: 'email',
          enabled: process.env.SMTP_HOST ? true : false,
          config: {
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT || 587,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
            recipients: process.env.SECURITY_EMAIL_RECIPIENTS?.split(',') || []
          }
        },
        {
          name: 'webhook',
          enabled: process.env.SECURITY_WEBHOOK_URL ? true : false,
          config: {
            url: process.env.SECURITY_WEBHOOK_URL,
            secret: process.env.SECURITY_WEBHOOK_SECRET
          }
        }
      ],
      thresholds: {
        immediate: ['CRITICAL', 'HIGH'],
        batched: ['MEDIUM', 'LOW']
      },
      rateLimit: {
        maxAlertsPerHour: 50,
        maxAlertsPerDay: 200
      }
    };

    this.alertCounts = new Map();
  }

  /**
   * XSS攻撃アラートの送信
   */
  async sendXSSAttackAlert(incident: {
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
  }): Promise<void> {
    try {
      const securityIncident: SecurityIncident = {
        id: this.generateIncidentId(),
        type: 'XSS_ATTACK',
        severity: this.mapRiskLevelToSeverity(incident.riskLevel),
        timestamp: new Date(),
        userId: incident.userId,
        ipAddress: incident.ipAddress,
        userAgent: incident.userAgent,
        url: incident.url,
        method: incident.method,
        details: {
          riskLevel: incident.riskLevel,
          confidence: incident.confidence,
          detectedPatterns: incident.detectedPatterns,
          matchedPayloads: incident.matchedPayloads,
          inputSample: incident.inputSample,
          attackType: 'XSS'
        },
        resolved: false
      };

      await this.processAlert(securityIncident);
    } catch (error) {
      console.error('Failed to send XSS attack alert:', error);
    }
  }

  /**
   * 複数攻撃の一括アラート
   */
  async sendBatchAlert(incidents: SecurityIncident[]): Promise<void> {
    try {
      if (incidents.length === 0) return;

      const summary = this.createBatchSummary(incidents);
      
      for (const channel of this.alertConfig.channels) {
        if (!channel.enabled) continue;

        switch (channel.name) {
          case 'slack':
            await this.sendSlackBatchAlert(summary, channel.config);
            break;
          case 'email':
            await this.sendEmailBatchAlert(summary, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookBatchAlert(summary, channel.config);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to send batch alert:', error);
    }
  }

  /**
   * 緊急アラートの送信
   */
  async sendCriticalAlert(incident: SecurityIncident): Promise<void> {
    try {
      // レート制限チェック
      if (!this.checkRateLimit(incident.ipAddress)) {
        console.warn('Rate limit exceeded for critical alerts');
        return;
      }

      for (const channel of this.alertConfig.channels) {
        if (!channel.enabled) continue;

        switch (channel.name) {
          case 'slack':
            await this.sendSlackCriticalAlert(incident, channel.config);
            break;
          case 'email':
            await this.sendEmailCriticalAlert(incident, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookCriticalAlert(incident, channel.config);
            break;
        }
      }

      this.updateAlertCounts(incident.ipAddress);
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  /**
   * メインのアラート処理
   */
  private async processAlert(incident: SecurityIncident): Promise<void> {
    const shouldSendImmediate = this.alertConfig.thresholds.immediate.includes(incident.severity);
    
    if (shouldSendImmediate) {
      await this.sendCriticalAlert(incident);
    } else {
      // バッチアラート用にキューに追加
      await this.addToBatchQueue(incident);
    }

    // インシデントをデータベースに保存
    await this.saveIncident(incident);
  }

  /**
   * Slack通知の送信
   */
  private async sendSlackCriticalAlert(incident: SecurityIncident, config: any): Promise<void> {
    if (!config.webhookUrl) return;

    const payload = {
      channel: config.channel,
      username: config.username,
      icon_emoji: ':warning:',
      attachments: [
        {
          color: this.getSeverityColor(incident.severity),
          title: `🚨 ${incident.severity} Security Incident Detected`,
          fields: [
            {
              title: 'Incident ID',
              value: incident.id,
              short: true
            },
            {
              title: 'Type',
              value: incident.type,
              short: true
            },
            {
              title: 'IP Address',
              value: incident.ipAddress,
              short: true
            },
            {
              title: 'URL',
              value: incident.url,
              short: true
            },
            {
              title: 'User ID',
              value: incident.userId || 'Unknown',
              short: true
            },
            {
              title: 'Timestamp',
              value: incident.timestamp.toISOString(),
              short: true
            },
            {
              title: 'Details',
              value: this.formatIncidentDetails(incident),
              short: false
            }
          ],
          footer: 'Security Monitoring System',
          ts: Math.floor(incident.timestamp.getTime() / 1000)
        }
      ]
    };

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Slackバッチアラート
   */
  private async sendSlackBatchAlert(summary: any, config: any): Promise<void> {
    if (!config.webhookUrl) return;

    const payload = {
      channel: config.channel,
      username: config.username,
      icon_emoji: ':warning:',
      text: `📊 Security Incidents Summary (${summary.timeRange})`,
      attachments: [
        {
          color: '#ffaa00',
          fields: [
            {
              title: 'Total Incidents',
              value: summary.totalIncidents.toString(),
              short: true
            },
            {
              title: 'Critical/High',
              value: summary.criticalCount.toString(),
              short: true
            },
            {
              title: 'Top Attack Type',
              value: summary.topAttackType,
              short: true
            },
            {
              title: 'Top Source IP',
              value: summary.topSourceIP,
              short: true
            },
            {
              title: 'Incident Breakdown',
              value: summary.breakdown,
              short: false
            }
          ],
          footer: 'Security Monitoring System - Batch Report'
        }
      ]
    };

    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack batch alert:', error);
    }
  }

  /**
   * メール通知の送信
   */
  private async sendEmailCriticalAlert(incident: SecurityIncident, config: any): Promise<void> {
    if (!config.smtpHost || !config.recipients.length) return;

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        }
      });

      const emailBody = this.createEmailBody(incident);

      await transporter.sendMail({
        from: config.smtpUser,
        to: config.recipients.join(','),
        subject: `🚨 ${incident.severity} Security Incident - ${incident.type}`,
        html: emailBody
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Webhook通知の送信
   */
  private async sendWebhookCriticalAlert(incident: SecurityIncident, config: any): Promise<void> {
    if (!config.url) return;

    try {
      const fetch = (await import('node-fetch')).default;
      const crypto = await import('crypto');
      
      const payload = JSON.stringify(incident);
      const signature = config.secret 
        ? crypto.createHmac('sha256', config.secret).update(payload).digest('hex')
        : undefined;

      const headers: any = { 'Content-Type': 'application/json' };
      if (signature) {
        headers['X-Signature'] = `sha256=${signature}`;
      }

      await fetch(config.url, {
        method: 'POST',
        headers,
        body: payload
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * ユーティリティメソッド
   */
  private mapRiskLevelToSeverity(riskLevel: XSSRiskLevel): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const mapping = {
      [XSSRiskLevel.LOW]: 'LOW' as const,
      [XSSRiskLevel.MEDIUM]: 'MEDIUM' as const,
      [XSSRiskLevel.HIGH]: 'HIGH' as const,
      [XSSRiskLevel.CRITICAL]: 'CRITICAL' as const
    };
    return mapping[riskLevel];
  }

  private generateIncidentId(): string {
    return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      'LOW': '#36a64f',
      'MEDIUM': '#ff9900',
      'HIGH': '#ff6600',
      'CRITICAL': '#ff0000'
    };
    return colors[severity as keyof typeof colors] || '#36a64f';
  }

  private formatIncidentDetails(incident: SecurityIncident): string {
    const details = incident.details;
    if (incident.type === 'XSS_ATTACK') {
      return `Risk Level: ${details.riskLevel}\nConfidence: ${details.confidence}%\nPatterns: ${details.detectedPatterns.slice(0, 3).join(', ')}\nInput Sample: ${details.inputSample.substring(0, 100)}...`;
    }
    return JSON.stringify(details, null, 2).substring(0, 500);
  }

  private createEmailBody(incident: SecurityIncident): string {
    return `
      <html>
        <body>
          <h2>🚨 Security Incident Alert</h2>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr><td><strong>Incident ID</strong></td><td>${incident.id}</td></tr>
            <tr><td><strong>Type</strong></td><td>${incident.type}</td></tr>
            <tr><td><strong>Severity</strong></td><td>${incident.severity}</td></tr>
            <tr><td><strong>Timestamp</strong></td><td>${incident.timestamp.toISOString()}</td></tr>
            <tr><td><strong>IP Address</strong></td><td>${incident.ipAddress}</td></tr>
            <tr><td><strong>URL</strong></td><td>${incident.url}</td></tr>
            <tr><td><strong>User ID</strong></td><td>${incident.userId || 'Unknown'}</td></tr>
            <tr><td><strong>User Agent</strong></td><td>${incident.userAgent}</td></tr>
          </table>
          <h3>Details</h3>
          <pre>${this.formatIncidentDetails(incident)}</pre>
          <p><em>This is an automated security alert from the Influencer Marketing Tool monitoring system.</em></p>
        </body>
      </html>
    `;
  }

  private createBatchSummary(incidents: SecurityIncident[]): any {
    const now = new Date();
    const summary = {
      timeRange: `${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()} - ${now.toISOString()}`,
      totalIncidents: incidents.length,
      criticalCount: incidents.filter(i => ['CRITICAL', 'HIGH'].includes(i.severity)).length,
      topAttackType: this.getMostFrequent(incidents.map(i => i.type)),
      topSourceIP: this.getMostFrequent(incidents.map(i => i.ipAddress)),
      breakdown: ''
    };

    // 攻撃タイプ別の集計
    const typeCount: { [key: string]: number } = {};
    incidents.forEach(i => {
      typeCount[i.type] = (typeCount[i.type] || 0) + 1;
    });

    summary.breakdown = Object.entries(typeCount)
      .map(([type, count]) => `${type}: ${count}`)
      .join('\n');

    return summary;
  }

  private getMostFrequent(items: string[]): string {
    const frequency: { [key: string]: number } = {};
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  }

  private checkRateLimit(ipAddress: string): boolean {
    const now = new Date();
    const key = ipAddress;
    
    if (!this.alertCounts.has(key)) {
      this.alertCounts.set(key, { hourly: 0, daily: 0, lastReset: now });
      return true;
    }

    const counts = this.alertCounts.get(key)!;
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

    return counts.hourly < this.alertConfig.rateLimit.maxAlertsPerHour &&
           counts.daily < this.alertConfig.rateLimit.maxAlertsPerDay;
  }

  private updateAlertCounts(ipAddress: string): void {
    const key = ipAddress;
    const counts = this.alertCounts.get(key) || { hourly: 0, daily: 0, lastReset: new Date() };
    counts.hourly++;
    counts.daily++;
    this.alertCounts.set(key, counts);
  }

  private async addToBatchQueue(incident: SecurityIncident): Promise<void> {
    // 実装例：Redis、データベース、または In-memory queue
    console.log('Added to batch queue:', incident.id);
  }

  private async saveIncident(incident: SecurityIncident): Promise<void> {
    // 実装例：データベースへの保存
    console.log('Saved incident:', incident.id);
  }

  // バッチ処理用のメソッド（定期実行）
  async processBatchAlerts(): Promise<void> {
    // 実装：バッチキューからインシデントを取得して一括送信
  }

  // Webhook送信用のメソッド（その他のアラート）
  private async sendEmailBatchAlert(summary: any, config: any): Promise<void> {
    // 実装：バッチメール送信
  }

  private async sendWebhookBatchAlert(summary: any, config: any): Promise<void> {
    // 実装：バッチWebhook送信
  }
}

// シングルトンインスタンス
export const securityAlertService = new SecurityAlertService();

export default SecurityAlertService;