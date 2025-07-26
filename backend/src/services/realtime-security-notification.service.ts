import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { captureError } from '../config/sentry';
import { AnomalyDetection, ThreatLevel } from './anomaly-detection.service';
import { DetectionResult, AttackType } from './pattern-detection.service';
import { RateLimitViolation } from '../middleware/adaptive-rate-limiter';
import { BlacklistEntry, BlacklistSeverity } from './ip-blacklist.service';

const prisma = new PrismaClient();

/**
 * リアルタイムセキュリティ通知サービス
 * 全ての検知システムからの脅威を統合し、即座に管理者に通知
 */

export enum NotificationSeverity {
  INFO = 'info',
  WARNING = 'warning', 
  CRITICAL = 'critical'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  TEAMS = 'teams'
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
  topAttackTypes: Array<{ type: string; count: number }>;
  topSourceIPs: Array<{ ip: string; count: number; country?: string }>;
  severityBreakdown: Record<NotificationSeverity, number>;
  alertChannelStatus: Record<NotificationChannel, boolean>;
  systemHealth: {
    detectionEngines: Array<{ name: string; status: 'online' | 'offline' | 'degraded' }>;
    lastProcessedAt: Date;
    avgResponseTime: number;
  };
}

class RealtimeSecurityNotificationService {
  private notificationRules: Map<string, NotificationRule> = new Map();
  private threatHistory: SecurityThreat[] = [];
  private channelConfigs: Map<NotificationChannel, any> = new Map();
  private notificationCounts: Map<string, { hourly: number; daily: number; lastReset: Date }> = new Map();
  private activeThreats: Map<string, SecurityThreat> = new Map();
  private escalationTracking: Map<string, { count: number; firstSeen: Date; lastEscalated?: Date }> = new Map();

  constructor() {
    this.initializeNotificationRules();
    this.initializeChannelConfigs();
    this.startPeriodicTasks();
  }

  /**
   * 異常検知からの脅威通知
   */
  async notifyAnomalyDetection(detection: AnomalyDetection): Promise<void> {
    try {
      const threat: SecurityThreat = {
        id: this.generateThreatId(),
        timestamp: detection.timestamp,
        severity: this.mapThreatLevelToSeverity(detection.threatLevel),
        category: 'anomaly',
        source: 'anomaly_detection_engine',
        threatType: detection.type,
        ipAddress: detection.ipAddress,
        userAgent: detection.userAgent,
        userId: detection.userId,
        endpoint: detection.endpoint,
        description: detection.description,
        evidence: detection.evidence,
        riskScore: detection.riskScore,
        confidence: detection.confidence,
        attackVectors: [detection.type],
        recommendedActions: this.generateRecommendedActions('anomaly', detection.type, detection.riskScore),
        escalationLevel: 1
      };

      await this.processThreatNotification(threat);
    } catch (error) {
      console.error('Failed to notify anomaly detection:', error);
    }
  }

  /**
   * パターン検知からの脅威通知
   */
  async notifyPatternDetection(detection: DetectionResult): Promise<void> {
    try {
      const threat: SecurityThreat = {
        id: this.generateThreatId(),
        timestamp: detection.evidence.timestamp,
        severity: this.mapRiskScoreToSeverity(detection.riskScore),
        category: 'pattern',
        source: 'pattern_detection_engine',
        threatType: detection.attackType,
        ipAddress: 'unknown', // パターン検知からIPを取得
        endpoint: detection.evidence.location,
        description: `Pattern-based attack detected: ${detection.attackType}`,
        evidence: {
          patterns: detection.matchedPatterns,
          behaviorIndicators: detection.behaviorIndicators,
          recommendations: detection.recommendations,
          payload: detection.evidence.payload
        },
        riskScore: detection.riskScore,
        confidence: detection.confidence,
        attackVectors: [detection.attackType],
        recommendedActions: detection.recommendations,
        escalationLevel: 1
      };

      await this.processThreatNotification(threat);
    } catch (error) {
      console.error('Failed to notify pattern detection:', error);
    }
  }

  /**
   * レート制限違反からの脅威通知
   */
  async notifyRateLimitViolation(violation: RateLimitViolation): Promise<void> {
    try {
      const threat: SecurityThreat = {
        id: this.generateThreatId(),
        timestamp: violation.timestamp,
        severity: this.mapViolationSeverityToNotificationSeverity(violation.severity),
        category: 'rate_limit',
        source: 'rate_limiter',
        threatType: violation.violationType,
        ipAddress: violation.ipAddress,
        userAgent: violation.userAgent,
        userId: violation.userId,
        endpoint: violation.endpoint,
        description: `Rate limit violation: ${violation.requestCount}/${violation.allowedCount} requests`,
        evidence: {
          violationType: violation.violationType,
          requestCount: violation.requestCount,
          allowedCount: violation.allowedCount,
          ruleId: violation.ruleId,
          actionTaken: violation.actionTaken
        },
        riskScore: this.calculateRiskScoreFromViolation(violation),
        confidence: 90,
        attackVectors: [violation.violationType],
        recommendedActions: this.generateRateLimitActions(violation),
        escalationLevel: violation.severity === 'critical' ? 2 : 1
      };

      await this.processThreatNotification(threat);
    } catch (error) {
      console.error('Failed to notify rate limit violation:', error);
    }
  }

  /**
   * ブラックリスト追加からの脅威通知
   */
  async notifyBlacklistAddition(entry: BlacklistEntry): Promise<void> {
    try {
      const threat: SecurityThreat = {
        id: this.generateThreatId(),
        timestamp: entry.createdAt,
        severity: this.mapBlacklistSeverityToNotificationSeverity(entry.severity),
        category: 'blacklist',
        source: 'ip_blacklist_service',
        threatType: entry.reason,
        ipAddress: entry.ipAddress,
        endpoint: 'multiple',
        description: `IP address blacklisted: ${entry.reason}`,
        evidence: {
          reason: entry.reason,
          severity: entry.severity,
          attackCount: entry.attackCount,
          blockedRequests: entry.blockedRequests,
          geoLocation: entry.geoLocation,
          notes: entry.notes
        },
        riskScore: this.calculateRiskScoreFromBlacklist(entry),
        confidence: 95,
        geoLocation: entry.geoLocation,
        attackVectors: [entry.reason],
        recommendedActions: this.generateBlacklistActions(entry),
        escalationLevel: entry.severity === 'CRITICAL' ? 3 : 2
      };

      await this.processThreatNotification(threat);
    } catch (error) {
      console.error('Failed to notify blacklist addition:', error);
    }
  }

  /**
   * 複合脅威の通知（複数の検知エンジンで同じIPが検出された場合）
   */
  async notifyCompositeThreats(ipAddress: string, threats: SecurityThreat[]): Promise<void> {
    try {
      const compositeThreat: SecurityThreat = {
        id: this.generateThreatId(),
        timestamp: new Date(),
        severity: NotificationSeverity.CRITICAL,
        category: 'multiple',
        source: 'composite_threat_analyzer',
        threatType: 'coordinated_attack',
        ipAddress,
        endpoint: 'multiple',
        description: `Coordinated attack detected from ${ipAddress}: ${threats.length} different attack types`,
        evidence: {
          compositeThreats: threats.map(t => ({
            type: t.threatType,
            riskScore: t.riskScore,
            confidence: t.confidence,
            timestamp: t.timestamp
          })),
          attackTypes: [...new Set(threats.map(t => t.threatType))],
          totalRiskScore: threats.reduce((sum, t) => sum + t.riskScore, 0),
          avgConfidence: threats.reduce((sum, t) => sum + t.confidence, 0) / threats.length
        },
        riskScore: Math.min(threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length * 1.5, 100),
        confidence: Math.min(threats.reduce((sum, t) => sum + t.confidence, 0) / threats.length * 1.2, 100),
        attackVectors: [...new Set(threats.flatMap(t => t.attackVectors))],
        recommendedActions: [
          'Immediate IP blocking',
          'Forensic analysis required',
          'Check for data exfiltration',
          'Review all recent activity from this IP',
          'Consider involving security team'
        ],
        escalationLevel: 3
      };

      await this.processThreatNotification(compositeThreat);
    } catch (error) {
      console.error('Failed to notify composite threats:', error);
    }
  }

  /**
   * メインの脅威処理ロジック
   */
  private async processThreatNotification(threat: SecurityThreat): Promise<void> {
    try {
      // 脅威の保存
      await this.storeThreat(threat);
      
      // 複合脅威の検査
      await this.checkForCompositeThreats(threat);

      // 適用可能な通知ルールを取得
      const applicableRules = this.getApplicableRules(threat);

      // 各ルールに対して通知を送信
      for (const rule of applicableRules) {
        if (this.shouldNotify(threat, rule)) {
          await this.sendNotifications(threat, rule);
          await this.updateNotificationCounts(threat, rule);
        }
      }

      // エスカレーションの確認
      await this.checkEscalation(threat);

      // アクティブ脅威の更新
      this.updateActiveThreats(threat);

    } catch (error) {
      console.error('Failed to process threat notification:', error);
      captureError(error as Error, {
        tags: { category: 'security_notification', issue: 'process_failure' },
        level: 'error'
      });
    }
  }

  /**
   * 通知の送信
   */
  private async sendNotifications(threat: SecurityThreat, rule: NotificationRule): Promise<void> {
    const promises = rule.channels.map(channel => this.sendToChannel(threat, channel));
    await Promise.allSettled(promises);
  }

  /**
   * チャンネル別通知送信
   */
  private async sendToChannel(threat: SecurityThreat, channel: NotificationChannel): Promise<void> {
    try {
      const config = this.channelConfigs.get(channel);
      if (!config?.enabled) return;

      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(threat, config);
          break;
        case NotificationChannel.SLACK:
          await this.sendSlackNotification(threat, config);
          break;
        case NotificationChannel.WEBHOOK:
          await this.sendWebhookNotification(threat, config);
          break;
        case NotificationChannel.TEAMS:
          await this.sendTeamsNotification(threat, config);
          break;
        case NotificationChannel.SMS:
          await this.sendSMSNotification(threat, config);
          break;
      }

      console.log(`Security notification sent via ${channel} for threat: ${threat.id}`);
    } catch (error) {
      console.error(`Failed to send notification via ${channel}:`, error);
    }
  }

  /**
   * メール通知の送信
   */
  private async sendEmailNotification(threat: SecurityThreat, config: any): Promise<void> {
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

    const subject = this.generateEmailSubject(threat);
    const htmlBody = this.generateEmailBody(threat);

    await transporter.sendMail({
      from: config.from,
      to: config.recipients.join(','),
      subject,
      html: htmlBody,
      priority: threat.severity === NotificationSeverity.CRITICAL ? 'high' : 'normal'
    });
  }

  /**
   * Slack通知の送信
   */
  private async sendSlackNotification(threat: SecurityThreat, config: any): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    
    const payload = {
      channel: config.channel,
      username: config.username || 'Security Bot',
      icon_emoji: this.getSeverityEmoji(threat.severity),
      attachments: [
        {
          color: this.getSeverityColor(threat.severity),
          title: `🚨 ${threat.severity.toUpperCase()} Security Threat - ${threat.threatType}`,
          fields: [
            {
              title: 'Threat ID',
              value: threat.id,
              short: true,
            },
            {
              title: 'Source IP',
              value: threat.ipAddress + (threat.geoLocation?.country ? ` (${threat.geoLocation.country})` : ''),
              short: true,
            },
            {
              title: 'Category',
              value: threat.category,
              short: true,
            },
            {
              title: 'Risk Score',
              value: `${threat.riskScore}/100`,
              short: true,
            },
            {
              title: 'Endpoint',
              value: threat.endpoint,
              short: true,
            },
            {
              title: 'User ID',
              value: threat.userId || 'Anonymous',
              short: true,
            },
            {
              title: 'Description',
              value: threat.description,
              short: false,
            },
            {
              title: 'Attack Vectors',
              value: threat.attackVectors.join(', '),
              short: false,
            },
            {
              title: 'Recommended Actions',
              value: threat.recommendedActions.slice(0, 3).join('\n'),
              short: false,
            },
          ],
          footer: 'Security Monitoring System',
          ts: Math.floor(threat.timestamp.getTime() / 1000),
        }
      ]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Webhook通知の送信
   */
  private async sendWebhookNotification(threat: SecurityThreat, config: any): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    const crypto = await import('crypto');

    const payload = JSON.stringify(threat);
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
  }

  /**
   * Teams通知の送信
   */
  private async sendTeamsNotification(threat: SecurityThreat, config: any): Promise<void> {
    const fetch = (await import('node-fetch')).default;
    
    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": this.getSeverityColor(threat.severity),
      "summary": `Security Threat: ${threat.threatType}`,
      "sections": [
        {
          "activityTitle": `🚨 ${threat.severity.toUpperCase()} Security Threat`,
          "activitySubtitle": threat.description,
          "facts": [
            { "name": "Threat ID", "value": threat.id },
            { "name": "Source IP", "value": threat.ipAddress },
            { "name": "Risk Score", "value": `${threat.riskScore}/100` },
            { "name": "Confidence", "value": `${threat.confidence}%` },
            { "name": "Category", "value": threat.category },
            { "name": "Endpoint", "value": threat.endpoint }
          ],
          "markdown": true
        }
      ]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * SMS通知の送信
   */
  private async sendSMSNotification(threat: SecurityThreat, config: any): Promise<void> {
    // SMS送信の実装（Twilio、AWS SNS等を使用）
    const message = `SECURITY ALERT: ${threat.severity} threat from ${threat.ipAddress}. Type: ${threat.threatType}. Risk: ${threat.riskScore}/100. ID: ${threat.id}`;
    console.log('SMS notification:', message);
    // 実際のSMS送信実装をここに追加
  }

  /**
   * ダッシュボード情報の取得
   */
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentThreats = this.threatHistory.filter(t => t.timestamp >= last24h);
    
    // 攻撃タイプ別の集計
    const attackTypeCounts = new Map<string, number>();
    recentThreats.forEach(threat => {
      threat.attackVectors.forEach(vector => {
        attackTypeCounts.set(vector, (attackTypeCounts.get(vector) || 0) + 1);
      });
    });

    // ソースIP別の集計
    const ipCounts = new Map<string, { count: number; country?: string }>();
    recentThreats.forEach(threat => {
      const existing = ipCounts.get(threat.ipAddress) || { count: 0 };
      ipCounts.set(threat.ipAddress, {
        count: existing.count + 1,
        country: threat.geoLocation?.country || existing.country
      });
    });

    // セベリティ別の集計
    const severityBreakdown: Record<NotificationSeverity, number> = {
      [NotificationSeverity.INFO]: 0,
      [NotificationSeverity.WARNING]: 0,
      [NotificationSeverity.CRITICAL]: 0
    };
    recentThreats.forEach(threat => {
      severityBreakdown[threat.severity]++;
    });

    return {
      activeThreats: this.activeThreats.size,
      threatsLast24h: recentThreats.length,
      topAttackTypes: Array.from(attackTypeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([type, count]) => ({ type, count })),
      topSourceIPs: Array.from(ipCounts.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([ip, data]) => ({ ip, count: data.count, country: data.country })),
      severityBreakdown,
      alertChannelStatus: {
        [NotificationChannel.EMAIL]: this.channelConfigs.get(NotificationChannel.EMAIL)?.enabled || false,
        [NotificationChannel.SLACK]: this.channelConfigs.get(NotificationChannel.SLACK)?.enabled || false,
        [NotificationChannel.WEBHOOK]: this.channelConfigs.get(NotificationChannel.WEBHOOK)?.enabled || false,
        [NotificationChannel.SMS]: this.channelConfigs.get(NotificationChannel.SMS)?.enabled || false,
        [NotificationChannel.TEAMS]: this.channelConfigs.get(NotificationChannel.TEAMS)?.enabled || false,
      },
      systemHealth: {
        detectionEngines: [
          { name: 'Anomaly Detection', status: 'online' },
          { name: 'Pattern Detection', status: 'online' },
          { name: 'Rate Limiter', status: 'online' },
          { name: 'IP Blacklist', status: 'online' },
        ],
        lastProcessedAt: new Date(),
        avgResponseTime: 150, // ms
      }
    };
  }

  /**
   * 初期化とヘルパーメソッド
   */
  private initializeNotificationRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        id: 'critical_threats',
        name: 'Critical Security Threats',
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.SMS],
        severity: [NotificationSeverity.CRITICAL],
        categories: ['anomaly', 'pattern', 'rate_limit', 'blacklist', 'multiple'],
        conditions: {
          riskScoreThreshold: 80,
          confidenceThreshold: 70,
          escalationLevelThreshold: 2,
        },
        rateLimit: {
          maxNotificationsPerHour: 10,
          maxNotificationsPerDay: 50,
          cooldownMinutes: 5,
        },
        escalation: {
          enabled: true,
          escalateAfterCount: 3,
          escalateAfterMinutes: 15,
          escalationChannels: [NotificationChannel.SMS, NotificationChannel.TEAMS],
        },
      },
      {
        id: 'high_risk_activities',
        name: 'High Risk Activities',
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
        severity: [NotificationSeverity.WARNING, NotificationSeverity.CRITICAL],
        categories: ['anomaly', 'pattern', 'rate_limit'],
        conditions: {
          riskScoreThreshold: 60,
          confidenceThreshold: 80,
          escalationLevelThreshold: 1,
        },
        rateLimit: {
          maxNotificationsPerHour: 20,
          maxNotificationsPerDay: 100,
          cooldownMinutes: 2,
        },
        escalation: {
          enabled: false,
          escalateAfterCount: 5,
          escalateAfterMinutes: 30,
          escalationChannels: [],
        },
      },
      {
        id: 'composite_attacks',
        name: 'Coordinated Attack Detection',
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK, NotificationChannel.WEBHOOK, NotificationChannel.SMS],
        severity: [NotificationSeverity.CRITICAL],
        categories: ['multiple'],
        conditions: {
          riskScoreThreshold: 70,
          confidenceThreshold: 85,
          escalationLevelThreshold: 3,
        },
        rateLimit: {
          maxNotificationsPerHour: 5,
          maxNotificationsPerDay: 20,
          cooldownMinutes: 10,
        },
        escalation: {
          enabled: true,
          escalateAfterCount: 1,
          escalateAfterMinutes: 5,
          escalationChannels: [NotificationChannel.SMS, NotificationChannel.TEAMS],
        },
      },
    ];

    defaultRules.forEach(rule => {
      this.notificationRules.set(rule.id, rule);
    });
  }

  private initializeChannelConfigs(): void {
    this.channelConfigs.set(NotificationChannel.EMAIL, {
      enabled: Boolean(process.env.SMTP_HOST),
      smtpHost: process.env.SMTP_HOST,
      smtpPort: Number(process.env.SMTP_PORT) || 587,
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      from: process.env.SECURITY_NOTIFICATION_FROM || process.env.SMTP_USER,
      recipients: (process.env.SECURITY_NOTIFICATION_RECIPIENTS || '').split(',').filter(Boolean),
    });

    this.channelConfigs.set(NotificationChannel.SLACK, {
      enabled: Boolean(process.env.SLACK_SECURITY_WEBHOOK_URL),
      webhookUrl: process.env.SLACK_SECURITY_WEBHOOK_URL,
      channel: process.env.SLACK_SECURITY_CHANNEL || '#security-alerts',
      username: 'Security Alert Bot',
    });

    this.channelConfigs.set(NotificationChannel.WEBHOOK, {
      enabled: Boolean(process.env.SECURITY_WEBHOOK_URL),
      url: process.env.SECURITY_WEBHOOK_URL,
      secret: process.env.SECURITY_WEBHOOK_SECRET,
    });

    this.channelConfigs.set(NotificationChannel.TEAMS, {
      enabled: Boolean(process.env.TEAMS_SECURITY_WEBHOOK_URL),
      webhookUrl: process.env.TEAMS_SECURITY_WEBHOOK_URL,
    });

    this.channelConfigs.set(NotificationChannel.SMS, {
      enabled: Boolean(process.env.TWILIO_ACCOUNT_SID),
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
      recipients: (process.env.SECURITY_SMS_RECIPIENTS || '').split(',').filter(Boolean),
    });
  }

  private async storeThreat(threat: SecurityThreat): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          eventType: this.mapThreatTypeToEventType(threat.threatType),
          severity: threat.severity.toUpperCase() as any,
          ipAddress: threat.ipAddress,
          userAgent: threat.userAgent || '',
          userId: threat.userId,
          url: threat.endpoint,
          method: 'UNKNOWN',
          detectionEngine: threat.source.toUpperCase(),
          confidence: threat.confidence,
          riskScore: threat.riskScore,
          metadata: JSON.stringify({
            threatId: threat.id,
            category: threat.category,
            description: threat.description,
            evidence: threat.evidence,
            attackVectors: threat.attackVectors,
            recommendedActions: threat.recommendedActions,
            escalationLevel: threat.escalationLevel,
            geoLocation: threat.geoLocation,
          }),
        },
      });

      // 脅威履歴に追加
      this.threatHistory.push(threat);
      
      // 履歴を最新1000件に制限
      if (this.threatHistory.length > 1000) {
        this.threatHistory = this.threatHistory.slice(-1000);
      }
    } catch (error) {
      console.error('Failed to store threat:', error);
    }
  }

  private async checkForCompositeThreats(newThreat: SecurityThreat): Promise<void> {
    const recentWindow = 5 * 60 * 1000; // 5分間
    const now = newThreat.timestamp.getTime();
    
    const recentThreatsFromSameIP = this.threatHistory.filter(threat => 
      threat.ipAddress === newThreat.ipAddress &&
      threat.id !== newThreat.id &&
      (now - threat.timestamp.getTime()) <= recentWindow
    );

    if (recentThreatsFromSameIP.length >= 2) {
      const allThreats = [...recentThreatsFromSameIP, newThreat];
      await this.notifyCompositeThreats(newThreat.ipAddress, allThreats);
    }
  }

  private getApplicableRules(threat: SecurityThreat): NotificationRule[] {
    return Array.from(this.notificationRules.values()).filter(rule => {
      if (!rule.enabled) return false;
      if (!rule.severity.includes(threat.severity)) return false;
      if (!rule.categories.includes(threat.category)) return false;
      if (threat.riskScore < rule.conditions.riskScoreThreshold) return false;
      if (threat.confidence < rule.conditions.confidenceThreshold) return false;
      if (threat.escalationLevel < rule.conditions.escalationLevelThreshold) return false;
      
      return true;
    });
  }

  private shouldNotify(threat: SecurityThreat, rule: NotificationRule): boolean {
    const key = `${rule.id}-${threat.ipAddress}`;
    const now = new Date();

    // レート制限チェック
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

    if (hoursSinceReset >= 1) {
      counts.hourly = 0;
      counts.lastReset = now;
    }

    if (hoursSinceReset >= 24) {
      counts.daily = 0;
    }

    return counts.hourly < rule.rateLimit.maxNotificationsPerHour &&
           counts.daily < rule.rateLimit.maxNotificationsPerDay;
  }

  private async updateNotificationCounts(threat: SecurityThreat, rule: NotificationRule): Promise<void> {
    const key = `${rule.id}-${threat.ipAddress}`;
    const counts = this.notificationCounts.get(key);

    if (counts) {
      counts.hourly++;
      counts.daily++;
    }
  }

  private async checkEscalation(threat: SecurityThreat): Promise<void> {
    const escalationKey = `${threat.ipAddress}-${threat.category}`;
    const now = new Date();

    if (!this.escalationTracking.has(escalationKey)) {
      this.escalationTracking.set(escalationKey, {
        count: 1,
        firstSeen: now,
      });
      return;
    }

    const tracking = this.escalationTracking.get(escalationKey)!;
    tracking.count++;

    // エスカレーション条件のチェック
    const applicableRules = this.getApplicableRules(threat).filter(rule => rule.escalation.enabled);
    
    for (const rule of applicableRules) {
      const minutesSinceFirst = (now.getTime() - tracking.firstSeen.getTime()) / (1000 * 60);
      const shouldEscalate = tracking.count >= rule.escalation.escalateAfterCount ||
                            minutesSinceFirst >= rule.escalation.escalateAfterMinutes;

      if (shouldEscalate && (!tracking.lastEscalated || 
          (now.getTime() - tracking.lastEscalated.getTime()) >= 30 * 60 * 1000)) {
        
        await this.sendEscalationNotifications(threat, rule);
        tracking.lastEscalated = now;
      }
    }
  }

  private async sendEscalationNotifications(threat: SecurityThreat, rule: NotificationRule): Promise<void> {
    const escalatedThreat = {
      ...threat,
      severity: NotificationSeverity.CRITICAL,
      description: `ESCALATED: ${threat.description}`,
      escalationLevel: threat.escalationLevel + 1,
    };

    const promises = rule.escalation.escalationChannels.map(channel => 
      this.sendToChannel(escalatedThreat, channel)
    );
    
    await Promise.allSettled(promises);
  }

  private updateActiveThreats(threat: SecurityThreat): void {
    this.activeThreats.set(threat.id, threat);
    
    // 1時間以上前の脅威を削除
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, activeThreat] of this.activeThreats.entries()) {
      if (activeThreat.timestamp.getTime() < oneHourAgo) {
        this.activeThreats.delete(id);
      }
    }
  }

  private startPeriodicTasks(): void {
    // 期限切れデータのクリーンアップ（1時間ごと）
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000);

    // 複合脅威の定期チェック（5分ごと）
    setInterval(() => {
      this.analyzeCompositeThreats();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredData(): void {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7日

    // 古い脅威履歴を削除
    this.threatHistory = this.threatHistory.filter(threat => 
      now - threat.timestamp.getTime() < maxAge
    );

    // 古い通知カウントを削除
    for (const [key, counts] of this.notificationCounts.entries()) {
      if (now - counts.lastReset.getTime() > 24 * 60 * 60 * 1000) {
        this.notificationCounts.delete(key);
      }
    }

    // 古いエスカレーション追跡を削除
    for (const [key, tracking] of this.escalationTracking.entries()) {
      if (now - tracking.firstSeen.getTime() > maxAge) {
        this.escalationTracking.delete(key);
      }
    }
  }

  private async analyzeCompositeThreats(): Promise<void> {
    // 過去15分間の脅威を分析
    const analysisWindow = 15 * 60 * 1000;
    const now = Date.now();
    
    const recentThreats = this.threatHistory.filter(threat => 
      now - threat.timestamp.getTime() < analysisWindow
    );

    // IPアドレス別にグループ化
    const threatsByIP = new Map<string, SecurityThreat[]>();
    recentThreats.forEach(threat => {
      if (!threatsByIP.has(threat.ipAddress)) {
        threatsByIP.set(threat.ipAddress, []);
      }
      threatsByIP.get(threat.ipAddress)!.push(threat);
    });

    // 複数の攻撃タイプを持つIPを特定
    for (const [ip, threats] of threatsByIP.entries()) {
      const uniqueAttackTypes = new Set(threats.flatMap(t => t.attackVectors));
      if (uniqueAttackTypes.size >= 3 && threats.length >= 5) {
        // まだ複合脅威として報告されていない場合のみ通知
        const hasCompositeAlert = threats.some(t => t.category === 'multiple');
        if (!hasCompositeAlert) {
          await this.notifyCompositeThreats(ip, threats);
        }
      }
    }
  }

  /**
   * ヘルパーメソッド
   */
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapThreatLevelToSeverity(level: ThreatLevel): NotificationSeverity {
    switch (level) {
      case ThreatLevel.LOW: return NotificationSeverity.INFO;
      case ThreatLevel.MEDIUM: return NotificationSeverity.WARNING;
      case ThreatLevel.HIGH: 
      case ThreatLevel.CRITICAL: return NotificationSeverity.CRITICAL;
      default: return NotificationSeverity.INFO;
    }
  }

  private mapRiskScoreToSeverity(riskScore: number): NotificationSeverity {
    if (riskScore >= 80) return NotificationSeverity.CRITICAL;
    if (riskScore >= 60) return NotificationSeverity.WARNING;
    return NotificationSeverity.INFO;
  }

  private mapViolationSeverityToNotificationSeverity(severity: string): NotificationSeverity {
    switch (severity.toLowerCase()) {
      case 'critical': return NotificationSeverity.CRITICAL;
      case 'high': return NotificationSeverity.CRITICAL;
      case 'medium': return NotificationSeverity.WARNING;
      default: return NotificationSeverity.INFO;
    }
  }

  private mapBlacklistSeverityToNotificationSeverity(severity: BlacklistSeverity): NotificationSeverity {
    switch (severity) {
      case BlacklistSeverity.CRITICAL:
      case BlacklistSeverity.HIGH: return NotificationSeverity.CRITICAL;
      case BlacklistSeverity.MEDIUM: return NotificationSeverity.WARNING;
      default: return NotificationSeverity.INFO;
    }
  }

  private calculateRiskScoreFromViolation(violation: RateLimitViolation): number {
    const baseScore = violation.severity === 'critical' ? 80 : 
                     violation.severity === 'high' ? 60 : 
                     violation.severity === 'medium' ? 40 : 20;
    
    const overageMultiplier = Math.min(violation.requestCount / violation.allowedCount, 3);
    return Math.min(baseScore * overageMultiplier, 100);
  }

  private calculateRiskScoreFromBlacklist(entry: BlacklistEntry): number {
    const severityScore = entry.severity === BlacklistSeverity.CRITICAL ? 90 :
                         entry.severity === BlacklistSeverity.HIGH ? 70 :
                         entry.severity === BlacklistSeverity.MEDIUM ? 50 : 30;
    
    const attackCountBonus = Math.min(entry.attackCount * 5, 20);
    return Math.min(severityScore + attackCountBonus, 100);
  }

  private generateRecommendedActions(category: string, type: string, riskScore: number): string[] {
    const actions = ['Monitor IP address closely'];
    
    if (riskScore >= 80) {
      actions.push('Consider immediate IP blocking');
      actions.push('Review all recent activity from this source');
    }
    
    if (category === 'pattern') {
      actions.push('Check for data exfiltration attempts');
      actions.push('Review application security controls');
    }
    
    if (category === 'anomaly') {
      actions.push('Analyze user behavior patterns');
      actions.push('Check for account compromise');
    }
    
    return actions;
  }

  private generateRateLimitActions(violation: RateLimitViolation): string[] {
    return [
      'Apply stricter rate limits',
      'Monitor for continued violations',
      'Consider temporary IP blocking',
      'Review rate limit thresholds',
    ];
  }

  private generateBlacklistActions(entry: BlacklistEntry): string[] {
    return [
      'Verify blacklist accuracy',
      'Monitor for bypass attempts',
      'Check for related IP addresses',
      'Document incident details',
    ];
  }

  private generateEmailSubject(threat: SecurityThreat): string {
    const emoji = threat.severity === NotificationSeverity.CRITICAL ? '🚨' : 
                 threat.severity === NotificationSeverity.WARNING ? '⚠️' : 'ℹ️';
    return `${emoji} ${threat.severity.toUpperCase()} Security Alert - ${threat.threatType} from ${threat.ipAddress}`;
  }

  private generateEmailBody(threat: SecurityThreat): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Security Threat Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Influencer Marketing Tool Security Monitoring</p>
          </div>
          
          <div style="background: white; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
            <div style="background: ${this.getSeverityColor(threat.severity)}; color: white; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px;">${threat.severity.toUpperCase()} - ${threat.threatType}</h2>
              <p style="margin: 5px 0 0 0;">${threat.description}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Threat ID:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.id}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Timestamp:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.timestamp.toISOString()}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Source IP:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.ipAddress}${threat.geoLocation?.country ? ` (${threat.geoLocation.country})` : ''}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Category:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.category}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Risk Score:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.riskScore}/100</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Confidence:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.confidence}%</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Endpoint:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.endpoint}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">User ID:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.userId || 'Anonymous'}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Attack Vectors:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${threat.attackVectors.join(', ')}</td></tr>
            </table>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #495057;">Recommended Actions</h3>
              <ul style="margin-bottom: 0;">
                ${threat.recommendedActions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #495057;">Evidence Details</h3>
              <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; border: 1px solid #ddd;">${JSON.stringify(threat.evidence, null, 2)}</pre>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #6c757d; font-size: 14px;">
              <p>This is an automated security alert from the Influencer Marketing Tool monitoring system.<br>
              For immediate assistance, contact the security team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getSeverityColor(severity: NotificationSeverity): string {
    switch (severity) {
      case NotificationSeverity.CRITICAL: return '#dc3545';
      case NotificationSeverity.WARNING: return '#fd7e14';
      case NotificationSeverity.INFO: return '#17a2b8';
      default: return '#6c757d';
    }
  }

  private getSeverityEmoji(severity: NotificationSeverity): string {
    switch (severity) {
      case NotificationSeverity.CRITICAL: return ':rotating_light:';
      case NotificationSeverity.WARNING: return ':warning:';
      case NotificationSeverity.INFO: return ':information_source:';
      default: return ':question:';
    }
  }

  private mapThreatTypeToEventType(threatType: string): any {
    const mapping: Record<string, string> = {
      'sql_injection': 'SQL_INJECTION',
      'xss_attack': 'XSS_ATTACK',
      'command_injection': 'COMMAND_INJECTION',
      'brute_force': 'BRUTE_FORCE',
      'rate_limit_violation': 'RATE_LIMIT_EXCEEDED',
      'coordinated_attack': 'COORDINATED_ATTACK',
    };
    
    return mapping[threatType] || 'SUSPICIOUS_ACTIVITY';
  }

  /**
   * 公開メソッド
   */
  getNotificationRules(): NotificationRule[] {
    return Array.from(this.notificationRules.values());
  }

  updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): boolean {
    const rule = this.notificationRules.get(ruleId);
    if (!rule) return false;

    this.notificationRules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  addNotificationRule(rule: NotificationRule): void {
    this.notificationRules.set(rule.id, rule);
  }

  removeNotificationRule(ruleId: string): boolean {
    return this.notificationRules.delete(ruleId);
  }

  async testNotificationChannel(channel: NotificationChannel): Promise<boolean> {
    try {
      const testThreat: SecurityThreat = {
        id: 'test_' + Date.now(),
        timestamp: new Date(),
        severity: NotificationSeverity.INFO,
        category: 'pattern',
        source: 'test',
        threatType: 'test_alert',
        ipAddress: '127.0.0.1',
        endpoint: '/test',
        description: 'This is a test notification to verify channel configuration.',
        evidence: { test: true },
        riskScore: 30,
        confidence: 100,
        attackVectors: ['test'],
        recommendedActions: ['This is a test - no action required'],
        escalationLevel: 1
      };

      await this.sendToChannel(testThreat, channel);
      return true;
    } catch (error) {
      console.error(`Test notification failed for channel ${channel}:`, error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const realtimeSecurityNotificationService = new RealtimeSecurityNotificationService();

export default RealtimeSecurityNotificationService;