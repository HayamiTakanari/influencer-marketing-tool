"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipBlacklistService = exports.BlacklistSeverity = exports.BlacklistReason = void 0;
const client_1 = require("@prisma/client");
const sentry_1 = require("../config/sentry");
const prisma = new client_1.PrismaClient();
/**
 * IP ブラックリスト管理サービス
 * 自動・手動でのIPブラックリスト管理とインテリジェントな検知
 */
var BlacklistReason;
(function (BlacklistReason) {
    BlacklistReason["MANUAL_BLOCK"] = "manual_block";
    BlacklistReason["RATE_LIMIT_VIOLATION"] = "rate_limit_violation";
    BlacklistReason["SECURITY_VIOLATION"] = "security_violation";
    BlacklistReason["MALICIOUS_ACTIVITY"] = "malicious_activity";
    BlacklistReason["BRUTE_FORCE_ATTACK"] = "brute_force_attack";
    BlacklistReason["SCANNER_ACTIVITY"] = "scanner_activity";
    BlacklistReason["SPAM_ACTIVITY"] = "spam_activity";
    BlacklistReason["GEOGRAPHICAL_RESTRICTION"] = "geographical_restriction";
    BlacklistReason["REPUTATION_BASED"] = "reputation_based";
    BlacklistReason["AUTOMATED_DETECTION"] = "automated_detection";
})(BlacklistReason || (exports.BlacklistReason = BlacklistReason = {}));
var BlacklistSeverity;
(function (BlacklistSeverity) {
    BlacklistSeverity["LOW"] = "LOW";
    BlacklistSeverity["MEDIUM"] = "MEDIUM";
    BlacklistSeverity["HIGH"] = "HIGH";
    BlacklistSeverity["CRITICAL"] = "CRITICAL";
})(BlacklistSeverity || (exports.BlacklistSeverity = BlacklistSeverity = {}));
class IPBlacklistService {
    constructor() {
        this.blacklistRules = new Map();
        this.geoThreatIntel = new Map();
        this.reputationCache = new Map();
        this.initializeDefaultRules();
        this.startPeriodicTasks();
    }
    /**
     * IPアドレスのブラックリストチェック
     */
    async isBlacklisted(ipAddress) {
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
        }
        catch (error) {
            console.error('Blacklist check error:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'blacklist', issue: 'check_error' },
                level: 'warning'
            });
            return { isBlacklisted: false };
        }
    }
    /**
     * IPアドレスのブラックリストへの追加
     */
    async addToBlacklist(params) {
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
        }
        catch (error) {
            console.error('Failed to add IP to blacklist:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'blacklist', issue: 'add_error' },
                level: 'error'
            });
            throw error;
        }
    }
    /**
     * 自動ブラックリスト判定
     */
    async evaluateForAutoBlacklist(ipAddress, violationData) {
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
        }
        catch (error) {
            console.error('Auto blacklist evaluation error:', error);
            return false;
        }
    }
    /**
     * 地理的脅威インテリジェンスの評価
     */
    async evaluateGeoThreat(ipAddress, geoLocation) {
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
        }
        catch (error) {
            console.error('Geo threat evaluation error:', error);
            return { shouldBlock: false, riskScore: 0 };
        }
    }
    /**
     * レピュテーションベースの評価
     */
    async evaluateReputation(ipAddress) {
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
            const sources = [];
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
        }
        catch (error) {
            console.error('Reputation evaluation error:', error);
            return { shouldBlock: false, reputationScore: 50, sources: [] };
        }
    }
    /**
     * ブラックリストからの削除
     */
    async removeFromBlacklist(ipAddress, reason, removedBy) {
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
        }
        catch (error) {
            console.error('Failed to remove IP from blacklist:', error);
            return false;
        }
    }
    /**
     * 期限切れエントリのクリーンアップ
     */
    async cleanupExpiredEntries() {
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
        }
        catch (error) {
            console.error('Failed to cleanup expired entries:', error);
            return 0;
        }
    }
    /**
     * ブラックリスト統計の取得
     */
    async getBlacklistStats() {
        try {
            const [total, active, recentlyAdded, topCountries, reasonCounts, severityCounts, blockedToday] = await Promise.all([
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
        }
        catch (error) {
            console.error('Failed to get blacklist stats:', error);
            return {
                totalBlacklisted: 0,
                activeBlacklisted: 0,
                recentlyAdded: 0,
                topCountries: [],
                reasonBreakdown: {},
                severityBreakdown: {},
                blockedRequestsToday: 0,
                falsePositiveRate: 0
            };
        }
    }
    /**
     * ヘルパーメソッド
     */
    initializeDefaultRules() {
        const defaultRules = [
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
    getApplicableRules(violationData) {
        return Array.from(this.blacklistRules.values())
            .filter(rule => rule.enabled)
            .filter(rule => this.ruleMatchesViolation(rule, violationData));
    }
    ruleMatchesViolation(rule, violationData) {
        // ルールの条件とviolationDataをマッチング
        if (rule.conditions.attackPatterns) {
            return rule.conditions.attackPatterns.includes(violationData.type);
        }
        return true;
    }
    async checkAutoBlockCriteria(ipAddress, rule) {
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
        }
        catch (error) {
            console.error('Failed to check auto block criteria:', error);
            return false;
        }
    }
    mapViolationTypeToReason(violationType) {
        const mapping = {
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
    async updateLastActivity(entryId) {
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
        }
        catch (error) {
            console.error('Failed to update last activity:', error);
        }
    }
    async updateBlacklistEntry(entryId, updates) {
        const entry = await prisma.iPBlacklist.update({
            where: { id: entryId },
            data: {
                ...updates,
                updatedAt: new Date()
            }
        });
        return this.mapPrismaToBlacklistEntry(entry);
    }
    mapPrismaToBlacklistEntry(prismaEntry) {
        return {
            id: prismaEntry.id,
            ipAddress: prismaEntry.ipAddress,
            cidr: prismaEntry.cidr,
            reason: prismaEntry.reason,
            severity: prismaEntry.severity,
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
    async notifyBlacklistAddition(entry) {
        // 高セベリティのブラックリスト追加を通知
        if (entry.severity === BlacklistSeverity.HIGH || entry.severity === BlacklistSeverity.CRITICAL) {
            (0, sentry_1.captureError)(new Error(`IP blacklisted: ${entry.ipAddress}`), {
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
    async fetchGeoThreatIntel(country) {
        // 外部脅威インテリジェンスAPIから情報を取得
        // 実装例は簡略化
        const defaultIntel = {
            country,
            riskScore: 50,
            threatCategories: [],
            lastUpdated: new Date()
        };
        this.geoThreatIntel.set(country, defaultIntel);
        return defaultIntel;
    }
    async checkAbuseIPDB(ipAddress) {
        // AbuseIPDB API呼び出し（API キーが必要）
        return { score: 50, source: 'abuseipdb' };
    }
    async checkVirusTotalReputation(ipAddress) {
        // VirusTotal API呼び出し
        return { score: 50, source: 'virustotal' };
    }
    async checkGreyNoiseReputation(ipAddress) {
        // GreyNoise API呼び出し
        return { score: 50, source: 'greynoise' };
    }
    async checkOwnReputation(ipAddress) {
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
                    case 'CRITICAL':
                        score -= 30;
                        break;
                    case 'HIGH':
                        score -= 20;
                        break;
                    case 'MEDIUM':
                        score -= 10;
                        break;
                    case 'LOW':
                        score -= 5;
                        break;
                }
            });
            return { score: Math.max(0, score), source: 'own' };
        }
        catch (error) {
            return { score: 50, source: 'own' };
        }
    }
    async getTopCountries() {
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
        }
        catch (error) {
            return [];
        }
    }
    async getReasonBreakdown() {
        try {
            const result = await prisma.iPBlacklist.groupBy({
                by: ['reason'],
                where: { isActive: true },
                _count: { reason: true }
            });
            const breakdown = {};
            Object.values(BlacklistReason).forEach(reason => {
                breakdown[reason] = 0;
            });
            result.forEach(r => {
                breakdown[r.reason] = r._count.reason;
            });
            return breakdown;
        }
        catch (error) {
            return {};
        }
    }
    async getSeverityBreakdown() {
        try {
            const result = await prisma.iPBlacklist.groupBy({
                by: ['severity'],
                where: { isActive: true },
                _count: { severity: true }
            });
            const breakdown = {};
            Object.values(BlacklistSeverity).forEach(severity => {
                breakdown[severity] = 0;
            });
            result.forEach(r => {
                breakdown[r.severity] = r._count.severity;
            });
            return breakdown;
        }
        catch (error) {
            return {};
        }
    }
    async getBlockedRequestsToday() {
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
        }
        catch (error) {
            return 0;
        }
    }
    async calculateFalsePositiveRate() {
        // 誤検知率の計算（実装は簡略化）
        return 0.05; // 5%
    }
    startPeriodicTasks() {
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
    async updateGeoThreatIntel() {
        // 脅威インテリジェンスの定期更新
        console.log('Updating geo threat intelligence...');
    }
    /**
     * 公開メソッド
     */
    getBlacklistRules() {
        return Array.from(this.blacklistRules.values());
    }
    updateRule(ruleId, updates) {
        const rule = this.blacklistRules.get(ruleId);
        if (!rule)
            return false;
        this.blacklistRules.set(ruleId, { ...rule, ...updates });
        return true;
    }
    addRule(rule) {
        this.blacklistRules.set(rule.id, rule);
    }
    removeRule(ruleId) {
        return this.blacklistRules.delete(ruleId);
    }
    async getBlacklistedIPs(params = {}) {
        const page = params.page || 1;
        const limit = params.limit || 50;
        const offset = (page - 1) * limit;
        const where = {};
        if (params.severity)
            where.severity = params.severity;
        if (params.reason)
            where.reason = params.reason;
        if (params.activeOnly !== false)
            where.isActive = true;
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
        }
        catch (error) {
            console.error('Failed to get blacklisted IPs:', error);
            return { entries: [], total: 0 };
        }
    }
}
// シングルトンインスタンス
exports.ipBlacklistService = new IPBlacklistService();
exports.default = IPBlacklistService;
//# sourceMappingURL=ip-blacklist.service.js.map