"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityAlertService = void 0;
const xss_detection_engine_1 = require("../utils/xss-detection-engine");
class SecurityAlertService {
    alertConfig;
    alertCounts;
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
    async sendXSSAttackAlert(incident) {
        try {
            const securityIncident = {
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
        }
        catch (error) {
            console.error('Failed to send XSS attack alert:', error);
        }
    }
    /**
     * 複数攻撃の一括アラート
     */
    async sendBatchAlert(incidents) {
        try {
            if (incidents.length === 0)
                return;
            const summary = this.createBatchSummary(incidents);
            for (const channel of this.alertConfig.channels) {
                if (!channel.enabled)
                    continue;
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
        }
        catch (error) {
            console.error('Failed to send batch alert:', error);
        }
    }
    /**
     * 緊急アラートの送信
     */
    async sendCriticalAlert(incident) {
        try {
            // レート制限チェック
            if (!this.checkRateLimit(incident.ipAddress)) {
                console.warn('Rate limit exceeded for critical alerts');
                return;
            }
            for (const channel of this.alertConfig.channels) {
                if (!channel.enabled)
                    continue;
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
        }
        catch (error) {
            console.error('Failed to send critical alert:', error);
        }
    }
    /**
     * メインのアラート処理
     */
    async processAlert(incident) {
        const shouldSendImmediate = this.alertConfig.thresholds.immediate.includes(incident.severity);
        if (shouldSendImmediate) {
            await this.sendCriticalAlert(incident);
        }
        else {
            // バッチアラート用にキューに追加
            await this.addToBatchQueue(incident);
        }
        // インシデントをデータベースに保存
        await this.saveIncident(incident);
    }
    /**
     * Slack通知の送信
     */
    async sendSlackCriticalAlert(incident, config) {
        if (!config.webhookUrl)
            return;
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
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Slack API error: ${response.status}`);
            }
        }
        catch (error) {
            console.error('Failed to send Slack alert:', error);
        }
    }
    /**
     * Slackバッチアラート
     */
    async sendSlackBatchAlert(summary, config) {
        if (!config.webhookUrl)
            return;
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
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            await fetch(config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        catch (error) {
            console.error('Failed to send Slack batch alert:', error);
        }
    }
    /**
     * メール通知の送信
     */
    async sendEmailCriticalAlert(incident, config) {
        if (!config.smtpHost || !config.recipients.length)
            return;
        try {
            const nodemailer = await Promise.resolve().then(() => __importStar(require('nodemailer')));
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
        }
        catch (error) {
            console.error('Failed to send email alert:', error);
        }
    }
    /**
     * Webhook通知の送信
     */
    async sendWebhookCriticalAlert(incident, config) {
        if (!config.url)
            return;
        try {
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
            const payload = JSON.stringify(incident);
            const signature = config.secret
                ? crypto.createHmac('sha256', config.secret).update(payload).digest('hex')
                : undefined;
            const headers = { 'Content-Type': 'application/json' };
            if (signature) {
                headers['X-Signature'] = `sha256=${signature}`;
            }
            await fetch(config.url, {
                method: 'POST',
                headers,
                body: payload
            });
        }
        catch (error) {
            console.error('Failed to send webhook alert:', error);
        }
    }
    /**
     * ユーティリティメソッド
     */
    mapRiskLevelToSeverity(riskLevel) {
        const mapping = {
            [xss_detection_engine_1.XSSRiskLevel.LOW]: 'LOW',
            [xss_detection_engine_1.XSSRiskLevel.MEDIUM]: 'MEDIUM',
            [xss_detection_engine_1.XSSRiskLevel.HIGH]: 'HIGH',
            [xss_detection_engine_1.XSSRiskLevel.CRITICAL]: 'CRITICAL'
        };
        return mapping[riskLevel];
    }
    generateIncidentId() {
        return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getSeverityColor(severity) {
        const colors = {
            'LOW': '#36a64f',
            'MEDIUM': '#ff9900',
            'HIGH': '#ff6600',
            'CRITICAL': '#ff0000'
        };
        return colors[severity] || '#36a64f';
    }
    formatIncidentDetails(incident) {
        const details = incident.details;
        if (incident.type === 'XSS_ATTACK') {
            return `Risk Level: ${details.riskLevel}\nConfidence: ${details.confidence}%\nPatterns: ${details.detectedPatterns.slice(0, 3).join(', ')}\nInput Sample: ${details.inputSample.substring(0, 100)}...`;
        }
        return JSON.stringify(details, null, 2).substring(0, 500);
    }
    createEmailBody(incident) {
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
    createBatchSummary(incidents) {
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
        const typeCount = {};
        incidents.forEach(i => {
            typeCount[i.type] = (typeCount[i.type] || 0) + 1;
        });
        summary.breakdown = Object.entries(typeCount)
            .map(([type, count]) => `${type}: ${count}`)
            .join('\n');
        return summary;
    }
    getMostFrequent(items) {
        const frequency = {};
        items.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    }
    checkRateLimit(ipAddress) {
        const now = new Date();
        const key = ipAddress;
        if (!this.alertCounts.has(key)) {
            this.alertCounts.set(key, { hourly: 0, daily: 0, lastReset: now });
            return true;
        }
        const counts = this.alertCounts.get(key);
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
    updateAlertCounts(ipAddress) {
        const key = ipAddress;
        const counts = this.alertCounts.get(key) || { hourly: 0, daily: 0, lastReset: new Date() };
        counts.hourly++;
        counts.daily++;
        this.alertCounts.set(key, counts);
    }
    async addToBatchQueue(incident) {
        // 実装例：Redis、データベース、または In-memory queue
        console.log('Added to batch queue:', incident.id);
    }
    async saveIncident(incident) {
        // 実装例：データベースへの保存
        console.log('Saved incident:', incident.id);
    }
    // バッチ処理用のメソッド（定期実行）
    async processBatchAlerts() {
        // 実装：バッチキューからインシデントを取得して一括送信
    }
    // Webhook送信用のメソッド（その他のアラート）
    async sendEmailBatchAlert(summary, config) {
        // 実装：バッチメール送信
    }
    async sendWebhookBatchAlert(summary, config) {
        // 実装：バッチWebhook送信
    }
}
// シングルトンインスタンス
exports.securityAlertService = new SecurityAlertService();
exports.default = SecurityAlertService;
