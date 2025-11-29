import { PrismaClient } from '@prisma/client';
import { captureError } from '../config/sentry';

const prisma = new PrismaClient();

/**
 * IP ブラックリスト管理サービス
 * 自動・手動でのIPブラックリスト管理とインテリジェントな検知
 */

export enum BlacklistReason {
  MANUAL_BLOCK = 'manual_block',
  RATE_LIMIT_VIOLATION = 'rate_limit_violation',
  SECURITY_VIOLATION = 'security_violation',
  MALICIOUS_ACTIVITY = 'malicious_activity',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  SCANNER_ACTIVITY = 'scanner_activity',
  SPAM_ACTIVITY = 'spam_activity',
  GEOGRAPHICAL_RESTRICTION = 'geographical_restriction',
  REPUTATION_BASED = 'reputation_based',
  AUTOMATED_DETECTION = 'automated_detection'
}

export enum BlacklistSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface BlacklistEntry {
  id: string;
  ipAddress: string;
  cidr?: string;
  reason: BlacklistReason;
  severity: BlacklistSeverity;
  firstDetected: Date;
  lastActivity: Date;
  attackCount: number;
  blockedRequests: number;
  isActive: boolean;
  expiresAt?: Date;
  permanent: boolean;
  geoLocation?: {
    country?: string;
    region?: string;
    asn?: string;
    isp?: string;
  };
  addedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlacklistRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: BlacklistSeverity;
  autoBlockThreshold: number;
  timeWindow: number; // minutes
  conditions: {
    rateLimitViolations?: number;
    securityViolations?: number;
    attackPatterns?: string[];
    geoRestrictions?: string[];
    reputationThreshold?: number;
  };
  blockDuration?: number; // minutes, undefined for permanent
  escalation: {
    enabled: boolean;
    escalationThreshold: number;
    escalationSeverity: BlacklistSeverity;
  };
}

export interface BlacklistStats {
  totalBlacklisted: number;
  activeBlacklisted: number;
  recentlyAdded: number;
  topCountries: Array<{ country: string; count: number }>;
  reasonBreakdown: Record<BlacklistReason, number>;
  severityBreakdown: Record<BlacklistSeverity, number>;
  blockedRequestsToday: number;
  falsePositiveRate: number;
}

export interface GeoThreatIntelligence {
  country: string;
  riskScore: number;
  threatCategories: string[];
  lastUpdated: Date;
}

class IPBlacklistService {
  private blacklistRules: Map<string, BlacklistRule> = new Map();
  private geoThreatIntel: Map<string, GeoThreatIntelligence> = new Map();
  private reputationCache: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.startPeriodicTasks();
  }

  /**
   * IPアドレスのブラックリストチェック
   */
  async isBlacklisted(ipAddress: string): Promise<{
    isBlacklisted: boolean;
    entry?: BlacklistEntry;
    reason?: string;
  }> {
    try {
      const entry = await prisma.iPBlacklist.findFirst({
        where: {
          AND: [
            {
              OR: [
                { ipAddress },
                // CIDR範囲での検索も可能（簡略化版）
                { cidr: { not: null } }
              ]
            },
            { isActive: true },
            {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          ]
        }
      });

      if (entry) {
        // 最後のアクティビティを更新
        await this.updateLastActivity(entry.id);

        return {
          isBlacklisted: true,
          entry: this.mapPrismaToBlacklistEntry(entry),
          reason: entry.reason
        };
      }

      return { isBlacklisted: false };

    } catch (error) {
      console.error('Blacklist check error:', error);
      captureError(error as Error, {
        tags: { category: 'blacklist', issue: 'check_error' },
        level: 'warning'
      });
      return { isBlacklisted: false };
    }
  }

  /**
   * IPアドレスのブラックリストへの追加
   */
  async addToBlacklist(params: {
    ipAddress: string;
    reason: BlacklistReason;
    severity: BlacklistSeverity;
    duration?: number; // minutes
    permanent?: boolean;
    notes?: string;
    addedBy?: string;
    geoLocation?: any;
  }): Promise<BlacklistEntry> {
    try {
      // 既存のエントリをチェック
      const existing = await prisma.iPBlacklist.findUnique({
        where: { ipAddress: params.ipAddress }
      });

      if (existing) {
        // 既存エントリの更新
        return await this.updateBlacklistEntry(existing.id, {
          reason: params.reason,
          severity: params.severity,
          attackCount: existing.attackCount + 1,
          lastActivity: new Date(),
          isActive: true,
          expiresAt: params.duration ? new Date(Date.now() + params.duration * 60 * 1000) : undefined,
          permanent: params.permanent || false,
          notes: params.notes,
        });
      }

      // 新規エントリの作成
      const entry = await prisma.iPBlacklist.create({
        data: {
          ipAddress: params.ipAddress,
          reason: params.reason,
          severity: params.severity,
          firstDetected: new Date(),
          lastActivity: new Date(),
          attackCount: 1,
          blockedRequests: 0,
          isActive: true,
          expiresAt: params.duration ? new Date(Date.now() + params.duration * 60 * 1000) : undefined,
          permanent: params.permanent || false,
          country: params.geoLocation?.country,
          region: params.geoLocation?.region,
          asn: params.geoLocation?.asn,
          isp: params.geoLocation?.isp,
          addedBy: params.addedBy,
          notes: params.notes,
        }
      });

      console.log(`IP ${params.ipAddress} added to blacklist: ${params.reason}`);

      // 通知の送信
      await this.notifyBlacklistAddition(this.mapPrismaToBlacklistEntry(entry));

      return this.mapPrismaToBlacklistEntry(entry);

    } catch (error) {
      console.error('Failed to add IP to blacklist:', error);
      captureError(error as Error, {
        tags: { category: 'blacklist', issue: 'add_error' },
        level: 'error'
      });
      throw error;
    }
  }

  /**
   * 自動ブラックリスト判定
   */
  async evaluateForAutoBlacklist(ipAddress: string, violationData: {
    type: string;
    severity: string;
    timestamp: Date;
    details?: any;
  }): Promise<boolean> {
    try {
      // 適用可能なルールを取得
      const applicableRules = this.getApplicableRules(violationData);

      for (const rule of applicableRules) {
        const shouldBlock = await this.checkAutoBlockCriteria(ipAddress, rule);

        if (shouldBlock) {
          await this.addToBlacklist({
            ipAddress,
            reason: this.mapViolationTypeToReason(violationData.type),
            severity: rule.severity,
            duration: rule.blockDuration,
            permanent: !rule.blockDuration,
            notes: `Auto-blocked by rule: ${rule.name}`,
            addedBy: 'system',
          });

          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Auto blacklist evaluation error:', error);
      return false;
    }
  }

  /**
   * 地理的脅威インテリジェンスの評価
   */
  async evaluateGeoThreat(ipAddress: string, geoLocation: any): Promise<{
    shouldBlock: boolean;
    riskScore: number;
    reason?: string;
  }> {
    try {
      const country = geoLocation.country;
      if (!country) {
        return { shouldBlock: false, riskScore: 0 };
      }

      // 地理的脅威インテリジェンスの取得
      const threatIntel = this.geoThreatIntel.get(country) || await this.fetchGeoThreatIntel(country);

      // 高リスク国からのアクセス
      if (threatIntel.riskScore > 80) {
        return {
          shouldBlock: true,
          riskScore: threatIntel.riskScore,
          reason: `High-risk geographical location: ${country}`
        };
      }

      // 制裁対象国チェック
      const sanctionedCountries = ['CN', 'RU', 'KP', 'IR']; // 例
      if (sanctionedCountries.includes(country)) {
        return {
          shouldBlock: true,
          riskScore: 100,
          reason: `Sanctioned country: ${country}`
        };
      }

      return {
        shouldBlock: false,
        riskScore: threatIntel.riskScore
      };

    } catch (error) {
      console.error('Geo threat evaluation error:', error);
      return { shouldBlock: false, riskScore: 0 };
    }
  }

  /**
   * レピュテーションベースの評価
   */
  async evaluateReputation(ipAddress: string): Promise<{
    shouldBlock: boolean;
    reputationScore: number;
    sources: string[];
  }> {
    try {
      // キャッシュされたレピュテーションをチェック
      const cached = this.reputationCache.get(ipAddress);
      if (cached !== undefined) {
        return {
          shouldBlock: cached < 30,
          reputationScore: cached,
          sources: ['cache']
        };
      }

      // 複数のレピュテーションソースから情報を取得
      const reputationSources = await Promise.allSettled([
        this.checkAbuseIPDB(ipAddress),
        this.checkVirusTotalReputation(ipAddress),
        this.checkGreyNoiseReputation(ipAddress),
        this.checkOwnReputation(ipAddress)
      ]);

      let totalScore = 50; // 中間値
      let validSources = 0;
      const sources: string[] = [];

      reputationSources.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.score !== undefined) {
          totalScore += result.value.score;
          validSources++;
          sources.push(result.value.source);
        }
      });

      const avgScore = validSources > 0 ? totalScore / (validSources + 1) : 50;

      // キャッシュに保存（1時間）
      this.reputationCache.set(ipAddress, avgScore);
      setTimeout(() => this.reputationCache.delete(ipAddress), 60 * 60 * 1000);

      return {
        shouldBlock: avgScore < 30,
        reputationScore: avgScore,
        sources
      };

    } catch (error) {
      console.error('Reputation evaluation error:', error);
      return { shouldBlock: false, reputationScore: 50, sources: [] };
    }
  }

  /**
   * ブラックリストからの削除
   */
  async removeFromBlacklist(ipAddress: string, reason?: string, removedBy?: string): Promise<boolean> {
    try {
      const result = await prisma.iPBlacklist.update({
        where: { ipAddress },
        data: {
          isActive: false,
          notes: reason ? `Removed: ${reason}` : 'Manually removed',
          updatedAt: new Date()
        }
      });

      console.log(`IP ${ipAddress} removed from blacklist by ${removedBy || 'system'}`);

      return !!result;

    } catch (error) {
      console.error('Failed to remove IP from blacklist:', error);
      return false;
    }
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const result = await prisma.iPBlacklist.updateMany({
        where: {
          isActive: true,
          permanent: false,
          expiresAt: {
            lte: new Date()
          }
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired blacklist entries`);
      }

      return result.count;

    } catch (error) {
      console.error('Failed to cleanup expired entries:', error);
      return 0;
    }
  }

  /**
   * ブラックリスト統計の取得
   */
  async getBlacklistStats(): Promise<BlacklistStats> {
    try {
      const [
        total,
        active,
        recentlyAdded,
        topCountries,
        reasonCounts,
        severityCounts,
        blockedToday
      ] = await Promise.all([
        prisma.iPBlacklist.count(),
        prisma.iPBlacklist.count({ where: { isActive: true } }),
        prisma.iPBlacklist.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        this.getTopCountries(),
        this.getReasonBreakdown(),
        this.getSeverityBreakdown(),
        this.getBlockedRequestsToday()
      ]);

      return {
        totalBlacklisted: total,
        activeBlacklisted: active,
        recentlyAdded,
        topCountries,
        reasonBreakdown: reasonCounts,
        severityBreakdown: severityCounts,
        blockedRequestsToday: blockedToday,
        falsePositiveRate: await this.calculateFalsePositiveRate()
      };

    } catch (error) {
      console.error('Failed to get blacklist stats:', error);
      return {
        totalBlacklisted: 0,
        activeBlacklisted: 0,
        recentlyAdded: 0,
        topCountries: [],
        reasonBreakdown: {} as any,
        severityBreakdown: {} as any,
        blockedRequestsToday: 0,
        falsePositiveRate: 0
      };
    }
  }

  /**
   * ヘルパーメソッド
   */
  private initializeDefaultRules(): void {
    const defaultRules: BlacklistRule[] = [
      {
        id: 'high_rate_violations',
        name: 'High Rate Limit Violations',
        description: 'Block IPs with excessive rate limit violations',
        enabled: true,
        severity: BlacklistSeverity.MEDIUM,
        autoBlockThreshold: 10,
        timeWindow: 5,
        conditions: {
          rateLimitViolations: 10
        },
        blockDuration: 60, // 1 hour
        escalation: {
          enabled: true,
          escalationThreshold: 3,
          escalationSeverity: BlacklistSeverity.HIGH
        }
      },
      {
        id: 'security_violations',
        name: 'Security Violations',
        description: 'Block IPs with security attack attempts',
        enabled: true,
        severity: BlacklistSeverity.HIGH,
        autoBlockThreshold: 3,
        timeWindow: 10,
        conditions: {
          securityViolations: 3,
          attackPatterns: ['sql_injection', 'xss_attempt', 'command_injection']
        },
        blockDuration: 240, // 4 hours
        escalation: {
          enabled: true,
          escalationThreshold: 2,
          escalationSeverity: BlacklistSeverity.CRITICAL
        }
      },
      {
        id: 'brute_force',
        name: 'Brute Force Attacks',
        description: 'Block IPs performing brute force attacks',
        enabled: true,
        severity: BlacklistSeverity.HIGH,
        autoBlockThreshold: 5,
        timeWindow: 15,
        conditions: {
          attackPatterns: ['brute_force']
        },
        blockDuration: 480, // 8 hours
        escalation: {
          enabled: false,
          escalationThreshold: 0,
          escalationSeverity: BlacklistSeverity.CRITICAL
        }
      },
      {
        id: 'scanner_activity',
        name: 'Scanner Activity',
        description: 'Block IPs showing automated scanning behavior',
        enabled: true,
        severity: BlacklistSeverity.LOW,
        autoBlockThreshold: 50,
        timeWindow: 30,
        conditions: {
          attackPatterns: ['scanner_activity']
        },
        blockDuration: 120, // 2 hours
        escalation: {
          enabled: true,
          escalationThreshold: 5,
          escalationSeverity: BlacklistSeverity.MEDIUM
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.blacklistRules.set(rule.id, rule);
    });
  }

  private getApplicableRules(violationData: any): BlacklistRule[] {
    return Array.from(this.blacklistRules.values())
      .filter(rule => rule.enabled)
      .filter(rule => this.ruleMatchesViolation(rule, violationData));
  }

  private ruleMatchesViolation(rule: BlacklistRule, violationData: any): boolean {
    // ルールの条件とviolationDataをマッチング
    if (rule.conditions.attackPatterns) {
      return rule.conditions.attackPatterns.includes(violationData.type);
    }
    return true;
  }

  private async checkAutoBlockCriteria(ipAddress: string, rule: BlacklistRule): Promise<boolean> {
    const timeWindow = new Date(Date.now() - rule.timeWindow * 60 * 1000);
    
    try {
      const violationCount = await prisma.securityLog.count({
        where: {
          ipAddress,
          detectedAt: {
            gte: timeWindow
          }
        }
      });

      return violationCount >= rule.autoBlockThreshold;

    } catch (error) {
      console.error('Failed to check auto block criteria:', error);
      return false;
    }
  }

  private mapViolationTypeToReason(violationType: string): BlacklistReason {
    const mapping: Record<string, BlacklistReason> = {
      'rate_limit_violation': BlacklistReason.RATE_LIMIT_VIOLATION,
      'sql_injection': BlacklistReason.SECURITY_VIOLATION,
      'xss_attempt': BlacklistReason.SECURITY_VIOLATION,
      'command_injection': BlacklistReason.SECURITY_VIOLATION,
      'brute_force': BlacklistReason.BRUTE_FORCE_ATTACK,
      'scanner_activity': BlacklistReason.SCANNER_ACTIVITY,
      'spam_activity': BlacklistReason.SPAM_ACTIVITY,
    };

    return mapping[violationType] || BlacklistReason.MALICIOUS_ACTIVITY;
  }

  private async updateLastActivity(entryId: string): Promise<void> {
    try {
      await prisma.iPBlacklist.update({
        where: { id: entryId },
        data: {
          lastActivity: new Date(),
          blockedRequests: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  private async updateBlacklistEntry(entryId: string, updates: any): Promise<BlacklistEntry> {
    const entry = await prisma.iPBlacklist.update({
      where: { id: entryId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return this.mapPrismaToBlacklistEntry(entry);
  }

  private mapPrismaToBlacklistEntry(prismaEntry: any): BlacklistEntry {
    return {
      id: prismaEntry.id,
      ipAddress: prismaEntry.ipAddress,
      cidr: prismaEntry.cidr,
      reason: prismaEntry.reason as BlacklistReason,
      severity: prismaEntry.severity as BlacklistSeverity,
      firstDetected: prismaEntry.firstDetected,
      lastActivity: prismaEntry.lastActivity,
      attackCount: prismaEntry.attackCount,
      blockedRequests: prismaEntry.blockedRequests,
      isActive: prismaEntry.isActive,
      expiresAt: prismaEntry.expiresAt,
      permanent: prismaEntry.permanent,
      geoLocation: {
        country: prismaEntry.country,
        region: prismaEntry.region,
        asn: prismaEntry.asn,
        isp: prismaEntry.isp,
      },
      addedBy: prismaEntry.addedBy,
      notes: prismaEntry.notes,
      createdAt: prismaEntry.createdAt,
      updatedAt: prismaEntry.updatedAt,
    };
  }

  private async notifyBlacklistAddition(entry: BlacklistEntry): Promise<void> {
    // 高セベリティのブラックリスト追加を通知
    if (entry.severity === BlacklistSeverity.HIGH || entry.severity === BlacklistSeverity.CRITICAL) {
      captureError(new Error(`IP blacklisted: ${entry.ipAddress}`), {
        tags: { 
          category: 'blacklist', 
          event: 'ip_blocked',
          severity: entry.severity,
          reason: entry.reason 
        },
        level: 'warning',
        extra: {
          ipAddress: entry.ipAddress,
          reason: entry.reason,
          geoLocation: entry.geoLocation
        }
      });
    }
  }

  private async fetchGeoThreatIntel(country: string): Promise<GeoThreatIntelligence> {
    // 外部脅威インテリジェンスAPIから情報を取得
    // 実装例は簡略化
    const defaultIntel: GeoThreatIntelligence = {
      country,
      riskScore: 50,
      threatCategories: [],
      lastUpdated: new Date()
    };

    this.geoThreatIntel.set(country, defaultIntel);
    return defaultIntel;
  }

  private async checkAbuseIPDB(ipAddress: string): Promise<{ score: number; source: string }> {
    // AbuseIPDB API呼び出し（API キーが必要）
    return { score: 50, source: 'abuseipdb' };
  }

  private async checkVirusTotalReputation(ipAddress: string): Promise<{ score: number; source: string }> {
    // VirusTotal API呼び出し
    return { score: 50, source: 'virustotal' };
  }

  private async checkGreyNoiseReputation(ipAddress: string): Promise<{ score: number; source: string }> {
    // GreyNoise API呼び出し
    return { score: 50, source: 'greynoise' };
  }

  private async checkOwnReputation(ipAddress: string): Promise<{ score: number; source: string }> {
    // 自社の過去ログから計算
    try {
      const recentLogs = await prisma.securityLog.findMany({
        where: {
          ipAddress,
          detectedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30日
          }
        },
        select: {
          severity: true,
          eventType: true
        }
      });

      if (recentLogs.length === 0) {
        return { score: 50, source: 'own' };
      }

      // セベリティベースでスコア計算
      let score = 100;
      recentLogs.forEach(log => {
        switch (log.severity) {
          case 'CRITICAL': score -= 30; break;
          case 'HIGH': score -= 20; break;
          case 'MEDIUM': score -= 10; break;
          case 'LOW': score -= 5; break;
        }
      });

      return { score: Math.max(0, score), source: 'own' };

    } catch (error) {
      return { score: 50, source: 'own' };
    }
  }

  private async getTopCountries(): Promise<Array<{ country: string; count: number }>> {
    try {
      const result = await prisma.iPBlacklist.groupBy({
        by: ['country'],
        where: {
          isActive: true,
          country: { not: null }
        },
        _count: {
          country: true
        },
        orderBy: {
          _count: {
            country: 'desc'
          }
        },
        take: 10
      });

      return result.map(r => ({
        country: r.country || 'Unknown',
        count: r._count.country
      }));

    } catch (error) {
      return [];
    }
  }

  private async getReasonBreakdown(): Promise<Record<BlacklistReason, number>> {
    try {
      const result = await prisma.iPBlacklist.groupBy({
        by: ['reason'],
        where: { isActive: true },
        _count: { reason: true }
      });

      const breakdown: Record<BlacklistReason, number> = {} as any;
      Object.values(BlacklistReason).forEach(reason => {
        breakdown[reason] = 0;
      });

      result.forEach(r => {
        breakdown[r.reason as BlacklistReason] = r._count.reason;
      });

      return breakdown;

    } catch (error) {
      return {} as any;
    }
  }

  private async getSeverityBreakdown(): Promise<Record<BlacklistSeverity, number>> {
    try {
      const result = await prisma.iPBlacklist.groupBy({
        by: ['severity'],
        where: { isActive: true },
        _count: { severity: true }
      });

      const breakdown: Record<BlacklistSeverity, number> = {} as any;
      Object.values(BlacklistSeverity).forEach(severity => {
        breakdown[severity] = 0;
      });

      result.forEach(r => {
        breakdown[r.severity as BlacklistSeverity] = r._count.severity;
      });

      return breakdown;

    } catch (error) {
      return {} as any;
    }
  }

  private async getBlockedRequestsToday(): Promise<number> {
    try {
      const result = await prisma.iPBlacklist.aggregate({
        where: {
          isActive: true,
          lastActivity: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          blockedRequests: true
        }
      });

      return result._sum.blockedRequests || 0;

    } catch (error) {
      return 0;
    }
  }

  private async calculateFalsePositiveRate(): Promise<number> {
    // 誤検知率の計算（実装は簡略化）
    return 0.05; // 5%
  }

  private startPeriodicTasks(): void {
    // 期限切れエントリのクリーンアップ（1時間ごと）
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 60 * 1000);

    // レピュテーションキャッシュのクリーンアップ（6時間ごと）
    setInterval(() => {
      this.reputationCache.clear();
    }, 6 * 60 * 60 * 1000);

    // 地理的脅威インテリジェンスの更新（24時間ごと）
    setInterval(() => {
      this.updateGeoThreatIntel();
    }, 24 * 60 * 60 * 1000);
  }

  private async updateGeoThreatIntel(): Promise<void> {
    // 脅威インテリジェンスの定期更新
    console.log('Updating geo threat intelligence...');
  }

  /**
   * 公開メソッド
   */
  getBlacklistRules(): BlacklistRule[] {
    return Array.from(this.blacklistRules.values());
  }

  updateRule(ruleId: string, updates: Partial<BlacklistRule>): boolean {
    const rule = this.blacklistRules.get(ruleId);
    if (!rule) return false;

    this.blacklistRules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  addRule(rule: BlacklistRule): void {
    this.blacklistRules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.blacklistRules.delete(ruleId);
  }

  async getBlacklistedIPs(params: {
    page?: number;
    limit?: number;
    severity?: BlacklistSeverity;
    reason?: BlacklistReason;
    activeOnly?: boolean;
  } = {}): Promise<{ entries: BlacklistEntry[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (params.severity) where.severity = params.severity;
    if (params.reason) where.reason = params.reason;
    if (params.activeOnly !== false) where.isActive = true;

    try {
      const [entries, total] = await Promise.all([
        prisma.iPBlacklist.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.iPBlacklist.count({ where })
      ]);

      return {
        entries: entries.map(e => this.mapPrismaToBlacklistEntry(e)),
        total
      };

    } catch (error) {
      console.error('Failed to get blacklisted IPs:', error);
      return { entries: [], total: 0 };
    }
  }
}

// シングルトンインスタンス
export const ipBlacklistService = new IPBlacklistService();

export default IPBlacklistService;