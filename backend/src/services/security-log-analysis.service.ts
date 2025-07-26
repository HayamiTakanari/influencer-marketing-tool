import { PrismaClient } from '@prisma/client';
import { captureError } from '../config/sentry';
import { SecurityThreat } from './realtime-security-notification.service';
import { SecurityAnalysisResult } from './security-orchestrator.service';

const prisma = new PrismaClient();

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

export enum SecurityEventType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTACK = 'XSS_ATTACK',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  BRUTE_FORCE = 'BRUTE_FORCE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  BLACKLIST_HIT = 'BLACKLIST_HIT',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  PATTERN_MATCHED = 'PATTERN_MATCHED',
  COORDINATED_ATTACK = 'COORDINATED_ATTACK',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  SCANNER_ACTIVITY = 'SCANNER_ACTIVITY',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  PHISHING_ATTEMPT = 'PHISHING_ATTEMPT',
  DDoS_ATTACK = 'DDoS_ATTACK'
}

export enum SecuritySeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityAnalytics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  topSourceIPs: Array<{ ip: string; count: number; avgRisk: number; country?: string }>;
  topUserAgents: Array<{ userAgent: string; count: number; avgRisk: number }>;
  topEndpoints: Array<{ endpoint: string; count: number; avgRisk: number }>;
  topUsers: Array<{ userId: string; count: number; avgRisk: number }>;
  geographicalDistribution: Array<{ country: string; count: number; avgRisk: number }>;
  timeSeriesData: Array<{ timestamp: Date; count: number; avgRisk: number }>;
  detectionEnginePerformance: Array<{ engine: string; count: number; falsePositiveRate: number }>;
  trendsAndPatterns: {
    hourlyDistribution: number[];
    dailyDistribution: number[];
    weeklyTrends: Array<{ week: string; count: number; avgRisk: number }>;
    emergingThreats: Array<{ type: string; growth: number; recentCount: number }>;
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

class SecurityLogAnalysisService {
  private logBuffer: SecurityLogEntry[] = [];
  private analyticsCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private readonly BUFFER_SIZE = 1000;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分

  constructor() {
    this.startPeriodicTasks();
  }

  /**
   * セキュリティイベントの記録
   */
  async logSecurityEvent(eventData: {
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
  }): Promise<SecurityLogEntry> {
    try {
      const logEntry: SecurityLogEntry = {
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

    } catch (error) {
      console.error('Failed to log security event:', error);
      captureError(error as Error, {
        tags: { category: 'security_logging', issue: 'log_failure' },
        level: 'error'
      });
      throw error;
    }
  }

  /**
   * セキュリティ脅威の一括記録
   */
  async logSecurityThreat(threat: SecurityThreat): Promise<SecurityLogEntry> {
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
  async logAnalysisResult(result: SecurityAnalysisResult): Promise<SecurityLogEntry[]> {
    const logEntries: SecurityLogEntry[] = [];

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
  async searchLogs(options: LogSearchOptions = {}): Promise<{
    logs: SecurityLogEntry[];
    total: number;
    aggregations: {
      eventTypes: Record<string, number>;
      severities: Record<string, number>;
      sources: Record<string, number>;
    };
  }> {
    try {
      const {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7日前
        endDate = new Date(),
        limit = 100,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = options;

      // Prismaクエリの構築
      const where: any = {
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
        if (options.riskScoreMin !== undefined) where.riskScore.gte = options.riskScoreMin;
        if (options.riskScoreMax !== undefined) where.riskScore.lte = options.riskScoreMax;
      }

      if (options.confidenceMin !== undefined || options.confidenceMax !== undefined) {
        where.confidence = {};
        if (options.confidenceMin !== undefined) where.confidence.gte = options.confidenceMin;
        if (options.confidenceMax !== undefined) where.confidence.lte = options.confidenceMax;
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
      const eventTypes: Record<string, number> = {};
      eventTypeAgg.forEach(item => {
        eventTypes[item.eventType] = item._count.eventType;
      });

      const severities: Record<string, number> = {};
      severityAgg.forEach(item => {
        severities[item.severity] = item._count.severity;
      });

      const sources: Record<string, number> = {};
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

    } catch (error) {
      console.error('Log search failed:', error);
      throw error;
    }
  }

  /**
   * セキュリティ分析の実行
   */
  async generateAnalytics(
    startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: Date = new Date()
  ): Promise<SecurityAnalytics> {
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
      const [
        totalEvents,
        eventTypeStats,
        severityStats,
        topIPs,
        topUserAgents,
        topEndpoints,
        geoStats,
        timeSeriesData,
      ] = await Promise.all([
        prisma.securityLog.count({ where }),
        this.getEventTypeStatistics(where),
        this.getSeverityStatistics(where),
        this.getTopSourceIPs(where),
        this.getTopUserAgents(where),
        this.getTopEndpoints(where),
        this.getGeographicalStatistics(where),
        this.getTimeSeriesData(where),
      ]);

      const analytics: SecurityAnalytics = {
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

    } catch (error) {
      console.error('Analytics generation failed:', error);
      throw error;
    }
  }

  /**
   * 脅威トレンド分析
   */
  async analyzeThreatTrends(
    threatType: SecurityEventType,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    lookbackDays: number = 30
  ): Promise<ThreatTrend> {
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

    } catch (error) {
      console.error('Threat trend analysis failed:', error);
      throw error;
    }
  }

  /**
   * ログのエクスポート
   */
  async exportLogs(options: LogExportOptions): Promise<string> {
    try {
      const { format, timeRange, filters = {} } = options;

      // 検索オプションの構築
      const searchOptions: LogSearchOptions = {
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

    } catch (error) {
      console.error('Log export failed:', error);
      throw error;
    }
  }

  /**
   * ログエントリの解決
   */
  async resolveLogEntry(
    logId: string,
    resolvedBy: string,
    notes?: string,
    falsePositive: boolean = false
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to resolve log entry:', error);
      return false;
    }
  }

  /**
   * プライベートメソッド
   */
  private async persistLogEntry(logEntry: SecurityLogEntry): Promise<void> {
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
    } catch (error) {
      console.error('Failed to persist log entry:', error);
    }
  }

  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const batch = this.logBuffer.splice(0, this.BUFFER_SIZE);
      await Promise.all(batch.map(entry => this.persistLogEntry(entry)));
      console.log(`Flushed ${batch.length} log entries to database`);
    } catch (error) {
      console.error('Failed to flush log buffer:', error);
    }
  }

  private async performRealtimeAnalysis(logEntry: SecurityLogEntry): Promise<void> {
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

  private async analyzeSequentialPatterns(logEntry: SecurityLogEntry): Promise<void> {
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

  private async forwardToExternalSystems(logEntry: SecurityLogEntry): Promise<void> {
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

  private async sendToElasticsearch(logEntry: SecurityLogEntry): Promise<void> {
    try {
      const fetch = (await import('node-fetch')).default;
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
    } catch (error) {
      console.error('Failed to send to Elasticsearch:', error);
    }
  }

  private async sendToSplunk(logEntry: SecurityLogEntry): Promise<void> {
    try {
      const fetch = (await import('node-fetch')).default;
      
      await fetch(process.env.SPLUNK_HEC_URL!, {
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
    } catch (error) {
      console.error('Failed to send to Splunk:', error);
    }
  }

  private async sendToDatadog(logEntry: SecurityLogEntry): Promise<void> {
    try {
      const fetch = (await import('node-fetch')).default;
      
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
    } catch (error) {
      console.error('Failed to send to Datadog:', error);
    }
  }

  private async getEventTypeStatistics(where: any): Promise<Record<SecurityEventType, number>> {
    const stats = await prisma.securityLog.groupBy({
      by: ['eventType'],
      where,
      _count: { eventType: true },
    });

    const result: Record<SecurityEventType, number> = {} as any;
    Object.values(SecurityEventType).forEach(type => {
      result[type] = 0;
    });

    stats.forEach(stat => {
      result[stat.eventType as SecurityEventType] = stat._count.eventType;
    });

    return result;
  }

  private async getSeverityStatistics(where: any): Promise<Record<SecuritySeverity, number>> {
    const stats = await prisma.securityLog.groupBy({
      by: ['severity'],
      where,
      _count: { severity: true },
    });

    const result: Record<SecuritySeverity, number> = {} as any;
    Object.values(SecuritySeverity).forEach(severity => {
      result[severity] = 0;
    });

    stats.forEach(stat => {
      result[stat.severity as SecuritySeverity] = stat._count.severity;
    });

    return result;
  }

  private async getTopSourceIPs(where: any): Promise<Array<{ ip: string; count: number; avgRisk: number; country?: string }>> {
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

  private async getTopUserAgents(where: any): Promise<Array<{ userAgent: string; count: number; avgRisk: number }>> {
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

  private async getTopEndpoints(where: any): Promise<Array<{ endpoint: string; count: number; avgRisk: number }>> {
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

  private async getTopUsers(where: any): Promise<Array<{ userId: string; count: number; avgRisk: number }>> {
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

  private async getGeographicalStatistics(where: any): Promise<Array<{ country: string; count: number; avgRisk: number }>> {
    // This would require extracting country from metadata
    // Simplified implementation
    return [];
  }

  private async getTimeSeriesData(where: any): Promise<Array<{ timestamp: Date; count: number; avgRisk: number }>> {
    // This would require complex time-based aggregation
    // Simplified implementation
    return [];
  }

  private async getDetectionEnginePerformance(where: any): Promise<Array<{ engine: string; count: number; falsePositiveRate: number }>> {
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

  private async getTrendsAndPatterns(where: any): Promise<SecurityAnalytics['trendsAndPatterns']> {
    return {
      hourlyDistribution: new Array(24).fill(0),
      dailyDistribution: new Array(7).fill(0),
      weeklyTrends: [],
      emergingThreats: [],
    };
  }

  private async getThreatTimeSeriesData(
    threatType: SecurityEventType,
    startDate: Date,
    endDate: Date,
    period: string
  ): Promise<ThreatTrend['data']> {
    // This would implement time-series aggregation
    return [];
  }

  private calculateGrowthRate(data: ThreatTrend['data']): number {
    if (data.length < 2) return 0;
    
    const firstPeriod = data.slice(0, Math.floor(data.length / 2));
    const secondPeriod = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstPeriod.reduce((sum, d) => sum + d.count, 0) / firstPeriod.length;
    const secondAvg = secondPeriod.reduce((sum, d) => sum + d.count, 0) / secondPeriod.length;
    
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  private generateForecast(data: ThreatTrend['data'], period: string): ThreatTrend['forecast'] {
    // Simple linear extrapolation
    if (data.length < 3) return [];
    
    const forecast: ThreatTrend['forecast'] = [];
    const periodMs = period === 'hour' ? 60 * 60 * 1000 :
                   period === 'day' ? 24 * 60 * 60 * 1000 :
                   period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                   30 * 24 * 60 * 60 * 1000;

    const lastPoint = data[data.length - 1];
    const trend = this.calculateTrend(data.slice(-5)); // Use last 5 points for trend

    for (let i = 1; i <= 5; i++) {
      const predictedCount = Math.max(0, lastPoint.count + (trend * i));
      const confidenceInterval: [number, number] = [
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

  private calculateTrend(data: ThreatTrend['data']): number {
    if (data.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].count - data[i-1].count);
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  private exportAsJSON(logs: SecurityLogEntry[], options: LogExportOptions): string {
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

  private exportAsCSV(logs: SecurityLogEntry[], options: LogExportOptions): string {
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

  private exportAsElasticsearch(logs: SecurityLogEntry[], options: LogExportOptions): string {
    return logs.map(log => {
      const header = { index: { _index: 'security-logs', _type: '_doc' } };
      const document = {
        '@timestamp': log.timestamp.toISOString(),
        ...log,
      };
      return JSON.stringify(header) + '\n' + JSON.stringify(document);
    }).join('\n');
  }

  private exportAsSplunk(logs: SecurityLogEntry[], options: LogExportOptions): string {
    return logs.map(log => JSON.stringify({
      time: Math.floor(log.timestamp.getTime() / 1000),
      event: log,
    })).join('\n');
  }

  private mapThreatTypeToEventType(threatType: string): SecurityEventType {
    const mapping: Record<string, SecurityEventType> = {
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

  private mapNotificationSeverityToSecuritySeverity(severity: string): SecuritySeverity {
    switch (severity.toLowerCase()) {
      case 'critical': return SecuritySeverity.CRITICAL;
      case 'warning': return SecuritySeverity.HIGH;
      case 'info': return SecuritySeverity.LOW;
      default: return SecuritySeverity.MEDIUM;
    }
  }

  private mapRiskLevelToSecuritySeverity(riskLevel: string): SecuritySeverity {
    switch (riskLevel) {
      case 'CRITICAL': return SecuritySeverity.CRITICAL;
      case 'HIGH': return SecuritySeverity.HIGH;
      case 'MEDIUM': return SecuritySeverity.MEDIUM;
      case 'LOW': return SecuritySeverity.LOW;
      default: return SecuritySeverity.INFO;
    }
  }

  private mapPrismaToLogEntry(prismaLog: any): SecurityLogEntry {
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

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicTasks(): void {
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

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.analyticsCache.entries()) {
      if (now - cached.timestamp.getTime() > this.CACHE_TTL) {
        this.analyticsCache.delete(key);
      }
    }
  }

  private async archiveOldLogs(): Promise<void> {
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
    } catch (error) {
      console.error('Log archival failed:', error);
    }
  }

  /**
   * 公開メソッド
   */
  getLogBufferStatus(): { size: number; maxSize: number } {
    return {
      size: this.logBuffer.length,
      maxSize: this.BUFFER_SIZE,
    };
  }

  async getSystemStats(): Promise<{
    totalLogs: number;
    logsToday: number;
    avgRiskScore: number;
    topThreats: Array<{ type: string; count: number }>;
  }> {
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
export const securityLogAnalysisService = new SecurityLogAnalysisService();

export default SecurityLogAnalysisService;