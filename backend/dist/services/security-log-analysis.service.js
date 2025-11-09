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
exports.securityLogAnalysisService = exports.SecuritySeverity = exports.SecurityEventType = void 0;
const client_1 = require("@prisma/client");
const sentry_1 = require("../config/sentry");
const prisma = new client_1.PrismaClient();
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["SQL_INJECTION"] = "SQL_INJECTION";
    SecurityEventType["XSS_ATTACK"] = "XSS_ATTACK";
    SecurityEventType["COMMAND_INJECTION"] = "COMMAND_INJECTION";
    SecurityEventType["PATH_TRAVERSAL"] = "PATH_TRAVERSAL";
    SecurityEventType["BRUTE_FORCE"] = "BRUTE_FORCE";
    SecurityEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    SecurityEventType["AUTHENTICATION_FAILURE"] = "AUTHENTICATION_FAILURE";
    SecurityEventType["AUTHORIZATION_FAILURE"] = "AUTHORIZATION_FAILURE";
    SecurityEventType["BLACKLIST_HIT"] = "BLACKLIST_HIT";
    SecurityEventType["ANOMALY_DETECTED"] = "ANOMALY_DETECTED";
    SecurityEventType["PATTERN_MATCHED"] = "PATTERN_MATCHED";
    SecurityEventType["COORDINATED_ATTACK"] = "COORDINATED_ATTACK";
    SecurityEventType["BOT_ACTIVITY"] = "BOT_ACTIVITY";
    SecurityEventType["SCANNER_ACTIVITY"] = "SCANNER_ACTIVITY";
    SecurityEventType["DATA_EXFILTRATION"] = "DATA_EXFILTRATION";
    SecurityEventType["PRIVILEGE_ESCALATION"] = "PRIVILEGE_ESCALATION";
    SecurityEventType["MALWARE_DETECTED"] = "MALWARE_DETECTED";
    SecurityEventType["PHISHING_ATTEMPT"] = "PHISHING_ATTEMPT";
    SecurityEventType["DDoS_ATTACK"] = "DDoS_ATTACK";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["INFO"] = "INFO";
    SecuritySeverity["LOW"] = "LOW";
    SecuritySeverity["MEDIUM"] = "MEDIUM";
    SecuritySeverity["HIGH"] = "HIGH";
    SecuritySeverity["CRITICAL"] = "CRITICAL";
})(SecuritySeverity || (exports.SecuritySeverity = SecuritySeverity = {}));
class SecurityLogAnalysisService {
    logBuffer = [];
    analyticsCache = new Map();
    BUFFER_SIZE = 1000;
    CACHE_TTL = 5 * 60 * 1000; // 5分
    constructor() {
        this.startPeriodicTasks();
    }
    /**
     * セキュリティイベントの記録
     */
    async logSecurityEvent(eventData) {
        try {
            const logEntry = {
                id: this.generateLogId(),
                timestamp: new Date(),
                eventType: eventData.eventType,
                severity: eventData.severity,
                source: eventData.source,
                ipAddress: eventData.ipAddress,
                userAgent: eventData.userAgent,
                userId: eventData.userId,
                endpoint: eventData.endpoint,
                method: eventData.method,
                statusCode: eventData.statusCode,
                payload: eventData.payload,
                detectionEngine: eventData.detectionEngine,
                confidence: eventData.confidence,
                riskScore: eventData.riskScore,
                geoLocation: eventData.geoLocation,
                metadata: eventData.metadata,
                tags: eventData.tags || [],
                isResolved: false,
                falsePositive: false,
            };
            // バッファに追加
            this.logBuffer.push(logEntry);
            // データベースに即座に保存（高セベリティの場合）
            if (eventData.severity === SecuritySeverity.CRITICAL || eventData.severity === SecuritySeverity.HIGH) {
                await this.persistLogEntry(logEntry);
            }
            // バッファがフルの場合はバッチ保存
            if (this.logBuffer.length >= this.BUFFER_SIZE) {
                await this.flushLogBuffer();
            }
            // リアルタイム分析
            await this.performRealtimeAnalysis(logEntry);
            // 外部ログシステムへの送信
            await this.forwardToExternalSystems(logEntry);
            return logEntry;
        }
        catch (error) {
            console.error('Failed to log security event:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'security_logging', issue: 'log_failure' },
                level: 'error'
            });
            throw error;
        }
    }
    /**
     * セキュリティ脅威の一括記録
     */
    async logSecurityThreat(threat) {
        return await this.logSecurityEvent({
            eventType: this.mapThreatTypeToEventType(threat.threatType),
            severity: this.mapNotificationSeverityToSecuritySeverity(threat.severity),
            source: threat.source,
            ipAddress: threat.ipAddress,
            userAgent: threat.userAgent,
            userId: threat.userId,
            endpoint: threat.endpoint,
            method: 'UNKNOWN',
            detectionEngine: threat.source.toUpperCase(),
            confidence: threat.confidence,
            riskScore: threat.riskScore,
            geoLocation: threat.geoLocation,
            metadata: {
                threatId: threat.id,
                category: threat.category,
                description: threat.description,
                evidence: threat.evidence,
                attackVectors: threat.attackVectors,
                recommendedActions: threat.recommendedActions,
                escalationLevel: threat.escalationLevel,
            },
            tags: [...threat.attackVectors, threat.category, threat.source],
        });
    }
    /**
     * セキュリティ分析結果の記録
     */
    async logAnalysisResult(result) {
        const logEntries = [];
        // 複合分析結果として記録
        if (result.detectionCount > 1) {
            const compositeEntry = await this.logSecurityEvent({
                eventType: SecurityEventType.COORDINATED_ATTACK,
                severity: this.mapRiskLevelToSecuritySeverity(result.riskLevel),
                source: 'security_orchestrator',
                ipAddress: result.ipAddress,
                endpoint: 'multiple',
                method: 'MULTIPLE',
                detectionEngine: 'SECURITY_ORCHESTRATOR',
                confidence: 90,
                riskScore: result.totalRiskScore,
                metadata: {
                    analysisTimestamp: result.timestamp,
                    detectionCount: result.detectionCount,
                    detections: result.detections,
                    recommendedActions: result.recommendedActions,
                    shouldBlock: result.shouldBlock,
                    escalationRequired: result.escalationRequired,
                },
                tags: ['composite', 'orchestrator', result.riskLevel.toLowerCase()],
            });
            logEntries.push(compositeEntry);
        }
        return logEntries;
    }
    /**
     * ログ検索
     */
    async searchLogs(options = {}) {
        try {
            const { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
            endDate = new Date(), limit = 100, offset = 0, sortBy = 'timestamp', sortOrder = 'desc' } = options;
            // Prismaクエリの構築
            const where = {
                detectedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (options.eventTypes?.length) {
                where.eventType = { in: options.eventTypes };
            }
            if (options.severities?.length) {
                where.severity = { in: options.severities };
            }
            if (options.ipAddresses?.length) {
                where.ipAddress = { in: options.ipAddresses };
            }
            if (options.userIds?.length) {
                where.userId = { in: options.userIds };
            }
            if (options.riskScoreMin !== undefined || options.riskScoreMax !== undefined) {
                where.riskScore = {};
                if (options.riskScoreMin !== undefined)
                    where.riskScore.gte = options.riskScoreMin;
                if (options.riskScoreMax !== undefined)
                    where.riskScore.lte = options.riskScoreMax;
            }
            if (options.confidenceMin !== undefined || options.confidenceMax !== undefined) {
                where.confidence = {};
                if (options.confidenceMin !== undefined)
                    where.confidence.gte = options.confidenceMin;
                if (options.confidenceMax !== undefined)
                    where.confidence.lte = options.confidenceMax;
            }
            if (options.searchQuery) {
                where.OR = [
                    { url: { contains: options.searchQuery, mode: 'insensitive' } },
                    { userAgent: { contains: options.searchQuery, mode: 'insensitive' } },
                    { metadata: { path: ['description'], string_contains: options.searchQuery } },
                ];
            }
            // データ取得
            const [logs, total, eventTypeAgg, severityAgg, sourceAgg] = await Promise.all([
                prisma.securityLog.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    take: limit,
                    skip: offset,
                }),
                prisma.securityLog.count({ where }),
                prisma.securityLog.groupBy({
                    by: ['eventType'],
                    where,
                    _count: { eventType: true },
                }),
                prisma.securityLog.groupBy({
                    by: ['severity'],
                    where,
                    _count: { severity: true },
                }),
                prisma.securityLog.groupBy({
                    by: ['detectionEngine'],
                    where,
                    _count: { detectionEngine: true },
                }),
            ]);
            // 集計結果の整形
            const eventTypes = {};
            eventTypeAgg.forEach(item => {
                eventTypes[item.eventType] = item._count.eventType;
            });
            const severities = {};
            severityAgg.forEach(item => {
                severities[item.severity] = item._count.severity;
            });
            const sources = {};
            sourceAgg.forEach(item => {
                sources[item.detectionEngine] = item._count.detectionEngine;
            });
            return {
                logs: logs.map(log => this.mapPrismaToLogEntry(log)),
                total,
                aggregations: {
                    eventTypes,
                    severities,
                    sources,
                },
            };
        }
        catch (error) {
            console.error('Log search failed:', error);
            throw error;
        }
    }
    /**
     * セキュリティ分析の実行
     */
    async generateAnalytics(startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date()) {
        try {
            const cacheKey = `analytics_${startDate.getTime()}_${endDate.getTime()}`;
            const cached = this.analyticsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_TTL) {
                return cached.data;
            }
            const where = {
                detectedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            // 基本統計
            const [totalEvents, eventTypeStats, severityStats, topIPs, topUserAgents, topEndpoints, geoStats, timeSeriesData,] = await Promise.all([
                prisma.securityLog.count({ where }),
                this.getEventTypeStatistics(where),
                this.getSeverityStatistics(where),
                this.getTopSourceIPs(where),
                this.getTopUserAgents(where),
                this.getTopEndpoints(where),
                this.getGeographicalStatistics(where),
                this.getTimeSeriesData(where),
            ]);
            const analytics = {
                totalEvents,
                eventsByType: eventTypeStats,
                eventsBySeverity: severityStats,
                topSourceIPs: topIPs,
                topUserAgents: topUserAgents,
                topEndpoints: topEndpoints,
                topUsers: await this.getTopUsers(where),
                geographicalDistribution: geoStats,
                timeSeriesData,
                detectionEnginePerformance: await this.getDetectionEnginePerformance(where),
                trendsAndPatterns: await this.getTrendsAndPatterns(where),
            };
            // キャッシュに保存
            this.analyticsCache.set(cacheKey, {
                data: analytics,
                timestamp: new Date(),
            });
            return analytics;
        }
        catch (error) {
            console.error('Analytics generation failed:', error);
            throw error;
        }
    }
    /**
     * 脅威トレンド分析
     */
    async analyzeThreatTrends(threatType, period = 'day', lookbackDays = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
            // 時系列データの取得
            const data = await this.getThreatTimeSeriesData(threatType, startDate, endDate, period);
            // 成長率の計算
            const growthRate = this.calculateGrowthRate(data);
            // 予測の生成
            const forecast = this.generateForecast(data, period);
            return {
                threatType,
                period,
                data,
                growthRate,
                forecast,
            };
        }
        catch (error) {
            console.error('Threat trend analysis failed:', error);
            throw error;
        }
    }
    /**
     * ログのエクスポート
     */
    async exportLogs(options) {
        try {
            const { format, timeRange, filters = {} } = options;
            // 検索オプションの構築
            const searchOptions = {
                ...filters,
                startDate: timeRange.start,
                endDate: timeRange.end,
                limit: 10000, // エクスポート用の大きな制限
            };
            const { logs } = await this.searchLogs(searchOptions);
            switch (format) {
                case 'json':
                    return this.exportAsJSON(logs, options);
                case 'csv':
                    return this.exportAsCSV(logs, options);
                case 'elasticsearch':
                    return this.exportAsElasticsearch(logs, options);
                case 'splunk':
                    return this.exportAsSplunk(logs, options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        }
        catch (error) {
            console.error('Log export failed:', error);
            throw error;
        }
    }
    /**
     * ログエントリの解決
     */
    async resolveLogEntry(logId, resolvedBy, notes, falsePositive = false) {
        try {
            await prisma.securityLog.update({
                where: { id: logId },
                data: {
                    // isResolved: true,
                    // resolvedAt: new Date(),
                    // resolvedBy,
                    // falsePositive,
                    // notes,
                    metadata: {
                        // 既存のメタデータに解決情報を追加
                        resolution: {
                            resolved: true,
                            resolvedAt: new Date().toISOString(),
                            resolvedBy,
                            falsePositive,
                            notes,
                        }
                    }
                },
            });
            return true;
        }
        catch (error) {
            console.error('Failed to resolve log entry:', error);
            return false;
        }
    }
    /**
     * プライベートメソッド
     */
    async persistLogEntry(logEntry) {
        try {
            await prisma.securityLog.create({
                data: {
                    eventType: logEntry.eventType,
                    severity: logEntry.severity,
                    ipAddress: logEntry.ipAddress,
                    userAgent: logEntry.userAgent || '',
                    userId: logEntry.userId,
                    url: logEntry.endpoint,
                    method: logEntry.method,
                    payload: logEntry.payload,
                    detectionEngine: logEntry.detectionEngine,
                    confidence: logEntry.confidence,
                    riskScore: logEntry.riskScore,
                    metadata: JSON.stringify({
                        ...logEntry.metadata,
                        geoLocation: logEntry.geoLocation,
                        tags: logEntry.tags,
                        source: logEntry.source,
                    }),
                },
            });
        }
        catch (error) {
            console.error('Failed to persist log entry:', error);
        }
    }
    async flushLogBuffer() {
        if (this.logBuffer.length === 0)
            return;
        try {
            const batch = this.logBuffer.splice(0, this.BUFFER_SIZE);
            await Promise.all(batch.map(entry => this.persistLogEntry(entry)));
            console.log(`Flushed ${batch.length} log entries to database`);
        }
        catch (error) {
            console.error('Failed to flush log buffer:', error);
        }
    }
    async performRealtimeAnalysis(logEntry) {
        // リアルタイム分析ロジック
        if (logEntry.severity === SecuritySeverity.CRITICAL) {
            console.log('CRITICAL security event detected:', {
                id: logEntry.id,
                eventType: logEntry.eventType,
                ipAddress: logEntry.ipAddress,
                riskScore: logEntry.riskScore,
            });
        }
        // パターン検出のための連続分析
        await this.analyzeSequentialPatterns(logEntry);
    }
    async analyzeSequentialPatterns(logEntry) {
        // 同一IPからの連続的な攻撃パターンを分析
        const recentLogs = await prisma.securityLog.findMany({
            where: {
                ipAddress: logEntry.ipAddress,
                detectedAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000), // 過去5分
                },
            },
            orderBy: { detectedAt: 'desc' },
            take: 10,
        });
        if (recentLogs.length >= 3) {
            const eventTypes = [...new Set(recentLogs.map(log => log.eventType))];
            if (eventTypes.length >= 2) {
                console.log('Sequential attack pattern detected:', {
                    ipAddress: logEntry.ipAddress,
                    eventTypes,
                    count: recentLogs.length,
                });
            }
        }
    }
    async forwardToExternalSystems(logEntry) {
        // Elasticsearchへの送信
        if (process.env.ELASTICSEARCH_URL) {
            await this.sendToElasticsearch(logEntry);
        }
        // Splunkへの送信
        if (process.env.SPLUNK_HEC_URL) {
            await this.sendToSplunk(logEntry);
        }
        // Datadogへの送信
        if (process.env.DATADOG_API_KEY) {
            await this.sendToDatadog(logEntry);
        }
    }
    async sendToElasticsearch(logEntry) {
        try {
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            const indexName = `security-logs-${new Date().toISOString().slice(0, 7)}`; // monthly indices
            await fetch(`${process.env.ELASTICSEARCH_URL}/${indexName}/_doc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.ELASTICSEARCH_AUTH && {
                        'Authorization': `Basic ${Buffer.from(process.env.ELASTICSEARCH_AUTH).toString('base64')}`
                    }),
                },
                body: JSON.stringify({
                    '@timestamp': logEntry.timestamp.toISOString(),
                    event_type: logEntry.eventType,
                    severity: logEntry.severity,
                    source: logEntry.source,
                    ip_address: logEntry.ipAddress,
                    user_agent: logEntry.userAgent,
                    user_id: logEntry.userId,
                    endpoint: logEntry.endpoint,
                    method: logEntry.method,
                    detection_engine: logEntry.detectionEngine,
                    confidence: logEntry.confidence,
                    risk_score: logEntry.riskScore,
                    geo_location: logEntry.geoLocation,
                    metadata: logEntry.metadata,
                    tags: logEntry.tags,
                }),
            });
        }
        catch (error) {
            console.error('Failed to send to Elasticsearch:', error);
        }
    }
    async sendToSplunk(logEntry) {
        try {
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            await fetch(process.env.SPLUNK_HEC_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Splunk ${process.env.SPLUNK_HEC_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    time: Math.floor(logEntry.timestamp.getTime() / 1000),
                    host: 'influencer-marketing-tool',
                    source: 'security-monitoring',
                    sourcetype: 'security:event',
                    event: {
                        id: logEntry.id,
                        event_type: logEntry.eventType,
                        severity: logEntry.severity,
                        ip_address: logEntry.ipAddress,
                        endpoint: logEntry.endpoint,
                        risk_score: logEntry.riskScore,
                        ...logEntry.metadata,
                    },
                }),
            });
        }
        catch (error) {
            console.error('Failed to send to Splunk:', error);
        }
    }
    async sendToDatadog(logEntry) {
        try {
            const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
            await fetch('https://http-intake.logs.datadoghq.com/v1/input/' + process.env.DATADOG_API_KEY, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ddsource: 'security-monitoring',
                    ddtags: `env:${process.env.NODE_ENV},service:influencer-marketing-tool,event_type:${logEntry.eventType}`,
                    hostname: 'security-system',
                    message: JSON.stringify({
                        timestamp: logEntry.timestamp,
                        event_type: logEntry.eventType,
                        severity: logEntry.severity,
                        ip_address: logEntry.ipAddress,
                        endpoint: logEntry.endpoint,
                        risk_score: logEntry.riskScore,
                        confidence: logEntry.confidence,
                        detection_engine: logEntry.detectionEngine,
                        metadata: logEntry.metadata,
                    }),
                }),
            });
        }
        catch (error) {
            console.error('Failed to send to Datadog:', error);
        }
    }
    async getEventTypeStatistics(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['eventType'],
            where,
            _count: { eventType: true },
        });
        const result = {};
        Object.values(SecurityEventType).forEach(type => {
            result[type] = 0;
        });
        stats.forEach(stat => {
            result[stat.eventType] = stat._count.eventType;
        });
        return result;
    }
    async getSeverityStatistics(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['severity'],
            where,
            _count: { severity: true },
        });
        const result = {};
        Object.values(SecuritySeverity).forEach(severity => {
            result[severity] = 0;
        });
        stats.forEach(stat => {
            result[stat.severity] = stat._count.severity;
        });
        return result;
    }
    async getTopSourceIPs(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['ipAddress'],
            where,
            _count: { ipAddress: true },
            _avg: { riskScore: true },
            orderBy: { _count: { ipAddress: 'desc' } },
            take: 20,
        });
        return stats.map(stat => ({
            ip: stat.ipAddress,
            count: stat._count.ipAddress,
            avgRisk: Math.round(stat._avg.riskScore || 0),
        }));
    }
    async getTopUserAgents(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['userAgent'],
            where: {
                ...where,
                userAgent: { not: '' },
            },
            _count: { userAgent: true },
            _avg: { riskScore: true },
            orderBy: { _count: { userAgent: 'desc' } },
            take: 15,
        });
        return stats.map(stat => ({
            userAgent: stat.userAgent.substring(0, 100), // Truncate long user agents
            count: stat._count.userAgent,
            avgRisk: Math.round(stat._avg.riskScore || 0),
        }));
    }
    async getTopEndpoints(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['url'],
            where,
            _count: { url: true },
            _avg: { riskScore: true },
            orderBy: { _count: { url: 'desc' } },
            take: 20,
        });
        return stats.map(stat => ({
            endpoint: stat.url,
            count: stat._count.url,
            avgRisk: Math.round(stat._avg.riskScore || 0),
        }));
    }
    async getTopUsers(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['userId'],
            where: {
                ...where,
                userId: { not: null },
            },
            _count: { userId: true },
            _avg: { riskScore: true },
            orderBy: { _count: { userId: 'desc' } },
            take: 15,
        });
        return stats.map(stat => ({
            userId: stat.userId || 'anonymous',
            count: stat._count.userId,
            avgRisk: Math.round(stat._avg.riskScore || 0),
        }));
    }
    async getGeographicalStatistics(where) {
        // This would require extracting country from metadata
        // Simplified implementation
        return [];
    }
    async getTimeSeriesData(where) {
        // This would require complex time-based aggregation
        // Simplified implementation
        return [];
    }
    async getDetectionEnginePerformance(where) {
        const stats = await prisma.securityLog.groupBy({
            by: ['detectionEngine'],
            where,
            _count: { detectionEngine: true },
        });
        return stats.map(stat => ({
            engine: stat.detectionEngine,
            count: stat._count.detectionEngine,
            falsePositiveRate: 0.05, // This would be calculated from actual data
        }));
    }
    async getTrendsAndPatterns(where) {
        return {
            hourlyDistribution: new Array(24).fill(0),
            dailyDistribution: new Array(7).fill(0),
            weeklyTrends: [],
            emergingThreats: [],
        };
    }
    async getThreatTimeSeriesData(threatType, startDate, endDate, period) {
        // This would implement time-series aggregation
        return [];
    }
    calculateGrowthRate(data) {
        if (data.length < 2)
            return 0;
        const firstPeriod = data.slice(0, Math.floor(data.length / 2));
        const secondPeriod = data.slice(Math.floor(data.length / 2));
        const firstAvg = firstPeriod.reduce((sum, d) => sum + d.count, 0) / firstPeriod.length;
        const secondAvg = secondPeriod.reduce((sum, d) => sum + d.count, 0) / secondPeriod.length;
        return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    }
    generateForecast(data, period) {
        // Simple linear extrapolation
        if (data.length < 3)
            return [];
        const forecast = [];
        const periodMs = period === 'hour' ? 60 * 60 * 1000 :
            period === 'day' ? 24 * 60 * 60 * 1000 :
                period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                    30 * 24 * 60 * 60 * 1000;
        const lastPoint = data[data.length - 1];
        const trend = this.calculateTrend(data.slice(-5)); // Use last 5 points for trend
        for (let i = 1; i <= 5; i++) {
            const predictedCount = Math.max(0, lastPoint.count + (trend * i));
            const confidenceInterval = [
                Math.max(0, predictedCount * 0.8),
                predictedCount * 1.2
            ];
            forecast.push({
                timestamp: new Date(lastPoint.timestamp.getTime() + (periodMs * i)),
                predictedCount: Math.round(predictedCount),
                confidenceInterval,
            });
        }
        return forecast;
    }
    calculateTrend(data) {
        if (data.length < 2)
            return 0;
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i].count - data[i - 1].count);
        }
        return changes.reduce((sum, change) => sum + change, 0) / changes.length;
    }
    exportAsJSON(logs, options) {
        const data = {
            metadata: {
                exportTime: new Date().toISOString(),
                format: 'json',
                timeRange: options.timeRange,
                totalLogs: logs.length,
            },
            logs: options.includeMetadata ? logs : logs.map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                eventType: log.eventType,
                severity: log.severity,
                ipAddress: log.ipAddress,
                endpoint: log.endpoint,
                riskScore: log.riskScore,
            }))
        };
        return JSON.stringify(data, null, 2);
    }
    exportAsCSV(logs, options) {
        const headers = [
            'timestamp', 'eventType', 'severity', 'ipAddress', 'endpoint',
            'riskScore', 'confidence', 'detectionEngine'
        ];
        const rows = logs.map(log => [
            log.timestamp.toISOString(),
            log.eventType,
            log.severity,
            log.ipAddress,
            log.endpoint,
            log.riskScore,
            log.confidence,
            log.detectionEngine,
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    exportAsElasticsearch(logs, options) {
        return logs.map(log => {
            const header = { index: { _index: 'security-logs', _type: '_doc' } };
            const document = {
                '@timestamp': log.timestamp.toISOString(),
                ...log,
            };
            return JSON.stringify(header) + '\n' + JSON.stringify(document);
        }).join('\n');
    }
    exportAsSplunk(logs, options) {
        return logs.map(log => JSON.stringify({
            time: Math.floor(log.timestamp.getTime() / 1000),
            event: log,
        })).join('\n');
    }
    mapThreatTypeToEventType(threatType) {
        const mapping = {
            'sql_injection': SecurityEventType.SQL_INJECTION,
            'xss_attack': SecurityEventType.XSS_ATTACK,
            'command_injection': SecurityEventType.COMMAND_INJECTION,
            'brute_force': SecurityEventType.BRUTE_FORCE,
            'coordinated_attack': SecurityEventType.COORDINATED_ATTACK,
            'rate_limit_violation': SecurityEventType.RATE_LIMIT_EXCEEDED,
            'scanner_activity': SecurityEventType.SCANNER_ACTIVITY,
        };
        return mapping[threatType] || SecurityEventType.SUSPICIOUS_ACTIVITY;
    }
    mapNotificationSeverityToSecuritySeverity(severity) {
        switch (severity.toLowerCase()) {
            case 'critical': return SecuritySeverity.CRITICAL;
            case 'warning': return SecuritySeverity.HIGH;
            case 'info': return SecuritySeverity.LOW;
            default: return SecuritySeverity.MEDIUM;
        }
    }
    mapRiskLevelToSecuritySeverity(riskLevel) {
        switch (riskLevel) {
            case 'CRITICAL': return SecuritySeverity.CRITICAL;
            case 'HIGH': return SecuritySeverity.HIGH;
            case 'MEDIUM': return SecuritySeverity.MEDIUM;
            case 'LOW': return SecuritySeverity.LOW;
            default: return SecuritySeverity.INFO;
        }
    }
    mapPrismaToLogEntry(prismaLog) {
        return {
            id: prismaLog.id,
            timestamp: prismaLog.detectedAt,
            eventType: prismaLog.eventType,
            severity: prismaLog.severity,
            source: 'database',
            ipAddress: prismaLog.ipAddress,
            userAgent: prismaLog.userAgent,
            userId: prismaLog.userId,
            endpoint: prismaLog.url,
            method: prismaLog.method,
            statusCode: undefined,
            payload: prismaLog.payload,
            detectionEngine: prismaLog.detectionEngine,
            confidence: prismaLog.confidence,
            riskScore: prismaLog.riskScore,
            geoLocation: undefined,
            metadata: JSON.parse(prismaLog.metadata || '{}'),
            tags: [],
            isResolved: false,
            falsePositive: false,
        };
    }
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startPeriodicTasks() {
        // バッファフラッシュ（1分ごと）
        setInterval(() => {
            this.flushLogBuffer();
        }, 60 * 1000);
        // キャッシュクリーンアップ（10分ごと）
        setInterval(() => {
            this.cleanupCache();
        }, 10 * 60 * 1000);
        // ログアーカイブ（1日1回）
        setInterval(() => {
            this.archiveOldLogs();
        }, 24 * 60 * 60 * 1000);
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.analyticsCache.entries()) {
            if (now - cached.timestamp.getTime() > this.CACHE_TTL) {
                this.analyticsCache.delete(key);
            }
        }
    }
    async archiveOldLogs() {
        // 90日以上古いログをアーカイブ
        const archiveDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        try {
            const oldLogsCount = await prisma.securityLog.count({
                where: {
                    detectedAt: { lt: archiveDate }
                }
            });
            if (oldLogsCount > 0) {
                console.log(`Archiving ${oldLogsCount} old security logs...`);
                // 実際のアーカイブ処理（S3、ファイルシステム等）
                // await this.moveLogsToArchive(archiveDate);
                // データベースから削除
                // await prisma.securityLog.deleteMany({
                //   where: { detectedAt: { lt: archiveDate } }
                // });
            }
        }
        catch (error) {
            console.error('Log archival failed:', error);
        }
    }
    /**
     * 公開メソッド
     */
    getLogBufferStatus() {
        return {
            size: this.logBuffer.length,
            maxSize: this.BUFFER_SIZE,
        };
    }
    async getSystemStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalLogs, logsToday, avgRisk, topThreats] = await Promise.all([
            prisma.securityLog.count(),
            prisma.securityLog.count({
                where: { detectedAt: { gte: today } }
            }),
            prisma.securityLog.aggregate({
                _avg: { riskScore: true }
            }),
            prisma.securityLog.groupBy({
                by: ['eventType'],
                _count: { eventType: true },
                orderBy: { _count: { eventType: 'desc' } },
                take: 5,
            }),
        ]);
        return {
            totalLogs,
            logsToday,
            avgRiskScore: Math.round(avgRisk._avg.riskScore || 0),
            topThreats: topThreats.map(t => ({
                type: t.eventType,
                count: t._count.eventType,
            })),
        };
    }
}
// シングルトンインスタンス
exports.securityLogAnalysisService = new SecurityLogAnalysisService();
exports.default = SecurityLogAnalysisService;
