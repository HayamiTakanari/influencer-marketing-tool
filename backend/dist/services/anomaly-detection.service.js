"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anomalyDetectionService = exports.ThreatLevel = exports.AnomalyType = void 0;
const client_1 = require("@prisma/client");
const sentry_1 = require("../config/sentry");
const prisma = new client_1.PrismaClient();
/**
 * 異常パターン検出エンジン
 * 複数の検知手法を組み合わせてリアルタイム異常検知を実行
 */
var AnomalyType;
(function (AnomalyType) {
    AnomalyType["RATE_LIMIT_VIOLATION"] = "rate_limit_violation";
    AnomalyType["SUSPICIOUS_USER_AGENT"] = "suspicious_user_agent";
    AnomalyType["SQL_INJECTION"] = "sql_injection";
    AnomalyType["XSS_ATTEMPT"] = "xss_attempt";
    AnomalyType["COMMAND_INJECTION"] = "command_injection";
    AnomalyType["PATH_TRAVERSAL"] = "path_traversal";
    AnomalyType["BRUTE_FORCE"] = "brute_force";
    AnomalyType["SCANNER_ACTIVITY"] = "scanner_activity";
    AnomalyType["UNUSUAL_GEOGRAPHIC_ACCESS"] = "unusual_geographic_access";
    AnomalyType["SUSPICIOUS_API_USAGE"] = "suspicious_api_usage";
    AnomalyType["LARGE_PAYLOAD"] = "large_payload";
    AnomalyType["REPEATED_404_ERRORS"] = "repeated_404_errors";
    AnomalyType["SESSION_ANOMALY"] = "session_anomaly";
    AnomalyType["TIMESTAMP_MANIPULATION"] = "timestamp_manipulation";
    AnomalyType["BOT_ACTIVITY"] = "bot_activity";
})(AnomalyType || (exports.AnomalyType = AnomalyType = {}));
var ThreatLevel;
(function (ThreatLevel) {
    ThreatLevel["LOW"] = "low";
    ThreatLevel["MEDIUM"] = "medium";
    ThreatLevel["HIGH"] = "high";
    ThreatLevel["CRITICAL"] = "critical";
})(ThreatLevel || (exports.ThreatLevel = ThreatLevel = {}));
class AnomalyDetectionService {
    detectionRules = new Map();
    recentActivity = new Map(); // IP別の最近の活動
    geoCache = new Map(); // 地理的位置のキャッシュ
    detectionHistory = [];
    constructor() {
        this.initializeDefaultRules();
        this.startPeriodicCleanup();
    }
    /**
     * リクエストログを分析して異常を検知
     */
    async detectAnomalies(logData) {
        const detections = [];
        try {
            // 各検知ルールを実行
            for (const rule of this.detectionRules.values()) {
                if (!rule.enabled)
                    continue;
                let isAnomalous = false;
                let evidence = {};
                switch (rule.type) {
                    case AnomalyType.RATE_LIMIT_VIOLATION:
                        ({ isAnomalous, evidence } = await this.checkRateLimit(logData, rule));
                        break;
                    case AnomalyType.SUSPICIOUS_USER_AGENT:
                        ({ isAnomalous, evidence } = this.checkSuspiciousUserAgent(logData, rule));
                        break;
                    case AnomalyType.SQL_INJECTION:
                        ({ isAnomalous, evidence } = this.checkSQLInjection(logData, rule));
                        break;
                    case AnomalyType.XSS_ATTEMPT:
                        ({ isAnomalous, evidence } = this.checkXSSAttempt(logData, rule));
                        break;
                    case AnomalyType.COMMAND_INJECTION:
                        ({ isAnomalous, evidence } = this.checkCommandInjection(logData, rule));
                        break;
                    case AnomalyType.PATH_TRAVERSAL:
                        ({ isAnomalous, evidence } = this.checkPathTraversal(logData, rule));
                        break;
                    case AnomalyType.BRUTE_FORCE:
                        ({ isAnomalous, evidence } = await this.checkBruteForce(logData, rule));
                        break;
                    case AnomalyType.SCANNER_ACTIVITY:
                        ({ isAnomalous, evidence } = await this.checkScannerActivity(logData, rule));
                        break;
                    case AnomalyType.UNUSUAL_GEOGRAPHIC_ACCESS:
                        ({ isAnomalous, evidence } = await this.checkUnusualGeographicAccess(logData, rule));
                        break;
                    case AnomalyType.SUSPICIOUS_API_USAGE:
                        ({ isAnomalous, evidence } = await this.checkSuspiciousAPIUsage(logData, rule));
                        break;
                    case AnomalyType.LARGE_PAYLOAD:
                        ({ isAnomalous, evidence } = this.checkLargePayload(logData, rule));
                        break;
                    case AnomalyType.REPEATED_404_ERRORS:
                        ({ isAnomalous, evidence } = await this.checkRepeated404Errors(logData, rule));
                        break;
                    case AnomalyType.BOT_ACTIVITY:
                        ({ isAnomalous, evidence } = this.checkBotActivity(logData, rule));
                        break;
                    default:
                        if (rule.customLogic) {
                            isAnomalous = await rule.customLogic(logData);
                        }
                }
                if (isAnomalous) {
                    const detection = this.createDetection(rule, logData, evidence);
                    detections.push(detection);
                }
            }
            // 検知結果の記録
            if (detections.length > 0) {
                await this.recordDetections(detections);
                this.updateDetectionHistory(detections);
            }
            return detections;
        }
        catch (error) {
            console.error('Anomaly detection error:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'anomaly_detection', issue: 'detection_failure' },
                level: 'warning'
            });
            return [];
        }
    }
    /**
     * レート制限違反の検知
     */
    async checkRateLimit(logData, rule) {
        const key = `rate_${logData.ipAddress}`;
        const now = Date.now();
        const windowMs = rule.timeWindow * 60 * 1000;
        if (!this.recentActivity.has(key)) {
            this.recentActivity.set(key, []);
        }
        const activities = this.recentActivity.get(key);
        // 時間窓外のアクティビティを除去
        const recentActivities = activities.filter(activity => now - activity.timestamp < windowMs);
        recentActivities.push({ timestamp: now, path: logData.path });
        this.recentActivity.set(key, recentActivities);
        const requestCount = recentActivities.length;
        const isAnomalous = requestCount > rule.threshold;
        return {
            isAnomalous,
            evidence: {
                requestCount,
                threshold: rule.threshold,
                timeWindow: rule.timeWindow,
                recentPaths: recentActivities.slice(-5).map(a => a.path)
            }
        };
    }
    /**
     * 疑わしいUser-Agentの検知
     */
    checkSuspiciousUserAgent(logData, rule) {
        const userAgent = logData.userAgent;
        const suspiciousPatterns = [
            /sqlmap/i, /nmap/i, /nikto/i, /dirbuster/i, /gobuster/i,
            /masscan/i, /zap/i, /burp/i, /metasploit/i, /nessus/i,
            /acunetix/i, /wpscan/i, /nuclei/i, /ffuf/i, /dirb/i,
            /python-requests/i, /urllib/i, /curl\/7\.[0-9]/i,
            /wget/i, /libwww/i, /winhttp/i, /httpclient/i,
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /<script>/i, /javascript:/i, /eval\(/i, /alert\(/i
        ];
        const suspiciousIndicators = [];
        // パターンマッチング
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(userAgent)) {
                suspiciousIndicators.push(`matches_pattern_${pattern.source}`);
            }
        }
        // 異常な長さ
        if (userAgent.length < 10) {
            suspiciousIndicators.push('too_short');
        }
        else if (userAgent.length > 1000) {
            suspiciousIndicators.push('too_long');
        }
        // 特殊文字の多用
        const specialCharCount = (userAgent.match(/[<>'"();{}[\]]/g) || []).length;
        if (specialCharCount > 5) {
            suspiciousIndicators.push('excessive_special_chars');
        }
        // 空のUser-Agent
        if (!userAgent.trim()) {
            suspiciousIndicators.push('empty_user_agent');
        }
        const isAnomalous = suspiciousIndicators.length >= rule.threshold;
        return {
            isAnomalous,
            evidence: {
                userAgent,
                suspiciousIndicators,
                indicatorCount: suspiciousIndicators.length
            }
        };
    }
    /**
     * SQLインジェクション攻撃の検知
     */
    checkSQLInjection(logData, rule) {
        const checkText = `${logData.url} ${JSON.stringify(logData.query)}`;
        const sqlPatterns = [
            /union\s+select/i, /union\s+all\s+select/i,
            /insert\s+into/i, /delete\s+from/i, /update\s+set/i,
            /drop\s+table/i, /drop\s+database/i, /create\s+table/i,
            /exec\s*\(/i, /execute\s*\(/i, /sp_executesql/i,
            /xp_cmdshell/i, /sp_configure/i, /openquery/i,
            /'\s*or\s*'[^']*'\s*=\s*'/i, /'\s*or\s*1\s*=\s*1/i,
            /'\s*or\s*'a'\s*=\s*'a/i, /'\s*and\s*1\s*=\s*1/i,
            /char\s*\(\s*[0-9]/i, /ascii\s*\(/i, /substring\s*\(/i,
            /waitfor\s+delay/i, /benchmark\s*\(/i, /sleep\s*\(/i,
            /information_schema/i, /sysobjects/i, /systables/i,
            /pg_sleep/i, /pg_user/i, /version\s*\(\s*\)/i,
            /load_file\s*\(/i, /into\s+outfile/i, /into\s+dumpfile/i,
            /having\s+[0-9]/i, /group\s+by\s+[0-9]/i, /order\s+by\s+[0-9]/i,
            /'\s*(;|--|#)/i, /\/\*.*\*\//i
        ];
        const matches = [];
        for (const pattern of sqlPatterns) {
            const match = checkText.match(pattern);
            if (match) {
                matches.push({ pattern: pattern.source, match: match[0] });
            }
        }
        const isAnomalous = matches.length > 0;
        return {
            isAnomalous,
            evidence: {
                matches,
                checkedText: checkText.substring(0, 500),
                patternCount: matches.length
            }
        };
    }
    /**
     * XSS攻撃の検知
     */
    checkXSSAttempt(logData, rule) {
        const checkText = `${logData.url} ${JSON.stringify(logData.query)}`;
        const xssPatterns = [
            /<script[^>]*>/i, /<\/script>/i, /javascript:/i, /vbscript:/i,
            /onload\s*=/i, /onerror\s*=/i, /onclick\s*=/i, /onmouseover\s*=/i,
            /onchange\s*=/i, /onfocus\s*=/i, /onblur\s*=/i, /onsubmit\s*=/i,
            /<iframe[^>]*>/i, /<object[^>]*>/i, /<embed[^>]*>/i, /<applet[^>]*>/i,
            /<img[^>]*src[^>]*=/i, /<svg[^>]*>/i, /<math[^>]*>/i,
            /alert\s*\(/i, /confirm\s*\(/i, /prompt\s*\(/i, /eval\s*\(/i,
            /document\s*\.\s*write/i, /document\s*\.\s*cookie/i, /document\s*\.\s*location/i,
            /window\s*\.\s*location/i, /location\s*\.\s*href/i, /location\s*\.\s*replace/i,
            /expression\s*\(/i, /url\s*\(/i, /@import/i, /behaviour/i,
            /data\s*:\s*text\s*\/\s*html/i, /data\s*:\s*application/i,
            /&#x[0-9a-f]+;/i, /&#[0-9]+;/i, /%[0-9a-f]{2}/i,
            /String\s*\.\s*fromCharCode/i, /unescape\s*\(/i, /decodeURI/i
        ];
        const matches = [];
        for (const pattern of xssPatterns) {
            const match = checkText.match(pattern);
            if (match) {
                matches.push({ pattern: pattern.source, match: match[0] });
            }
        }
        const isAnomalous = matches.length > 0;
        return {
            isAnomalous,
            evidence: {
                matches,
                checkedText: checkText.substring(0, 500),
                patternCount: matches.length
            }
        };
    }
    /**
     * コマンドインジェクション攻撃の検知
     */
    checkCommandInjection(logData, rule) {
        const checkText = `${logData.url} ${JSON.stringify(logData.query)}`;
        const cmdPatterns = [
            /;\s*cat\s+/i, /;\s*ls\s+/i, /;\s*pwd/i, /;\s*id/i, /;\s*whoami/i,
            /;\s*ps\s+/i, /;\s*kill\s+/i, /;\s*rm\s+/i, /;\s*mv\s+/i, /;\s*cp\s+/i,
            /\|\s*cat\s+/i, /\|\s*ls\s+/i, /\|\s*pwd/i, /\|\s*id/i, /\|\s*whoami/i,
            /&&\s*cat\s+/i, /&&\s*ls\s+/i, /&&\s*pwd/i, /&&\s*id/i, /&&\s*whoami/i,
            /`cat\s+/i, /`ls\s+/i, /`pwd/i, /`id/i, /`whoami/i,
            /\$\(cat\s+/i, /\$\(ls\s+/i, /\$\(pwd/i, /\$\(id/i, /\$\(whoami/i,
            /nc\s+-/i, /netcat\s+-/i, /telnet\s+/i, /ssh\s+/i, /ftp\s+/i,
            /wget\s+/i, /curl\s+/i, /lynx\s+/i, /w3m\s+/i,
            /\/bin\/sh/i, /\/bin\/bash/i, /\/bin\/csh/i, /\/bin\/tcsh/i, /\/bin\/ksh/i,
            /cmd\.exe/i, /powershell/i, /wscript/i, /cscript/i,
            /eval\s*\(/i, /exec\s*\(/i, /system\s*\(/i, /passthru\s*\(/i,
            /shell_exec\s*\(/i, /popen\s*\(/i, /proc_open\s*\(/i
        ];
        const matches = [];
        for (const pattern of cmdPatterns) {
            const match = checkText.match(pattern);
            if (match) {
                matches.push({ pattern: pattern.source, match: match[0] });
            }
        }
        const isAnomalous = matches.length > 0;
        return {
            isAnomalous,
            evidence: {
                matches,
                checkedText: checkText.substring(0, 500),
                patternCount: matches.length
            }
        };
    }
    /**
     * パストラバーサル攻撃の検知
     */
    checkPathTraversal(logData, rule) {
        const checkText = logData.url;
        const pathPatterns = [
            /\.\.\//g, /\.\.\\/g, /\.\.%2f/gi, /\.\.%5c/gi,
            /%2e%2e%2f/gi, /%2e%2e%5c/gi, /%252e%252e%252f/gi,
            /\/etc\/passwd/i, /\/etc\/shadow/i, /\/etc\/hosts/i, /\/etc\/fstab/i,
            /\/proc\/self\/environ/i, /\/proc\/version/i, /\/proc\/cmdline/i,
            /\/var\/log\//i, /\/var\/www\//i, /\/usr\/local\//i,
            /c:\\windows\\system32\\/i, /c:\\users\\/i, /c:\\program files\\/i,
            /\\windows\\system32\\/i, /\\users\\/i, /\\program files\\/i,
            /boot\.ini/i, /win\.ini/i, /system\.ini/i, /autoexec\.bat/i,
            /config\.sys/i, /ntldr/i, /bootmgr/i, /pagefile\.sys/i
        ];
        const matches = [];
        for (const pattern of pathPatterns) {
            const match = checkText.match(pattern);
            if (match) {
                matches.push({ pattern: pattern.source, match: match[0] });
            }
        }
        // 連続するディレクトリトラバーサル文字の検出
        const traversalCount = (checkText.match(/\.\.\//g) || []).length;
        if (traversalCount >= 3) {
            matches.push({ pattern: 'multiple_traversal', match: `${traversalCount} traversals` });
        }
        const isAnomalous = matches.length > 0;
        return {
            isAnomalous,
            evidence: {
                matches,
                checkedText: checkText,
                traversalCount,
                patternCount: matches.length
            }
        };
    }
    /**
     * ブルートフォース攻撃の検知
     */
    async checkBruteForce(logData, rule) {
        // 認証関連のエンドポイントのみをチェック
        const authEndpoints = ['/api/auth/login', '/api/auth/signin', '/login', '/signin'];
        const isAuthEndpoint = authEndpoints.some(endpoint => logData.path.includes(endpoint));
        if (!isAuthEndpoint) {
            return { isAnomalous: false, evidence: {} };
        }
        const key = `brute_${logData.ipAddress}`;
        const now = Date.now();
        const windowMs = rule.timeWindow * 60 * 1000;
        if (!this.recentActivity.has(key)) {
            this.recentActivity.set(key, []);
        }
        const activities = this.recentActivity.get(key);
        const recentActivities = activities.filter(activity => now - activity.timestamp < windowMs);
        // 認証失敗の場合のみカウント
        if (logData.statusCode === 401 || logData.statusCode === 403) {
            recentActivities.push({
                timestamp: now,
                path: logData.path,
                statusCode: logData.statusCode,
                userId: logData.userId
            });
        }
        this.recentActivity.set(key, recentActivities);
        const failureCount = recentActivities.filter(a => a.statusCode === 401 || a.statusCode === 403).length;
        const isAnomalous = failureCount >= rule.threshold;
        return {
            isAnomalous,
            evidence: {
                failureCount,
                threshold: rule.threshold,
                timeWindow: rule.timeWindow,
                recentFailures: recentActivities.slice(-5)
            }
        };
    }
    /**
     * スキャナー活動の検知
     */
    async checkScannerActivity(logData, rule) {
        const key = `scanner_${logData.ipAddress}`;
        const now = Date.now();
        const windowMs = rule.timeWindow * 60 * 1000;
        if (!this.recentActivity.has(key)) {
            this.recentActivity.set(key, []);
        }
        const activities = this.recentActivity.get(key);
        const recentActivities = activities.filter(activity => now - activity.timestamp < windowMs);
        recentActivities.push({
            timestamp: now,
            path: logData.path,
            statusCode: logData.statusCode
        });
        this.recentActivity.set(key, recentActivities);
        // スキャナー活動の指標
        const uniquePaths = new Set(recentActivities.map(a => a.path)).size;
        const notFoundCount = recentActivities.filter(a => a.statusCode === 404).length;
        const rapidRequests = recentActivities.length;
        // 多数の異なるパスへのアクセス + 多数の404エラー
        const isAnomalous = (uniquePaths >= rule.threshold && notFoundCount >= rule.threshold * 0.7) ||
            (rapidRequests >= rule.threshold * 2);
        return {
            isAnomalous,
            evidence: {
                uniquePaths,
                notFoundCount,
                rapidRequests,
                threshold: rule.threshold,
                recentPaths: Array.from(new Set(recentActivities.slice(-10).map(a => a.path)))
            }
        };
    }
    /**
     * その他の検知メソッド（簡略化）
     */
    async checkUnusualGeographicAccess(logData, rule) {
        // 実装例：地理的位置の変化を検知
        if (!logData.userId || !logData.geoLocation) {
            return { isAnomalous: false, evidence: {} };
        }
        // TODO: ユーザーの通常のアクセス地域と比較
        return { isAnomalous: false, evidence: {} };
    }
    async checkSuspiciousAPIUsage(logData, rule) {
        // API使用パターンの異常を検知
        const isAPI = logData.path.startsWith('/api/');
        if (!isAPI)
            return { isAnomalous: false, evidence: {} };
        // TODO: API使用頻度、パターンの分析
        return { isAnomalous: false, evidence: {} };
    }
    checkLargePayload(logData, rule) {
        const payloadSize = logData.responseSize || 0;
        const isAnomalous = payloadSize > rule.threshold;
        return {
            isAnomalous,
            evidence: {
                payloadSize,
                threshold: rule.threshold,
                sizeMB: (payloadSize / 1024 / 1024).toFixed(2)
            }
        };
    }
    async checkRepeated404Errors(logData, rule) {
        if (logData.statusCode !== 404) {
            return { isAnomalous: false, evidence: {} };
        }
        const key = `404_${logData.ipAddress}`;
        const now = Date.now();
        const windowMs = rule.timeWindow * 60 * 1000;
        if (!this.recentActivity.has(key)) {
            this.recentActivity.set(key, []);
        }
        const activities = this.recentActivity.get(key);
        const recentActivities = activities.filter(activity => now - activity.timestamp < windowMs);
        recentActivities.push({ timestamp: now, path: logData.path });
        this.recentActivity.set(key, recentActivities);
        const count404 = recentActivities.length;
        const isAnomalous = count404 >= rule.threshold;
        return {
            isAnomalous,
            evidence: {
                count404,
                threshold: rule.threshold,
                recent404Paths: recentActivities.slice(-5).map(a => a.path)
            }
        };
    }
    checkBotActivity(logData, rule) {
        const isBot = logData.isBot;
        const isAnomalous = isBot && !this.isAllowedBot(logData.userAgent);
        return {
            isAnomalous,
            evidence: {
                userAgent: logData.userAgent,
                detectedAsBot: isBot,
                isAllowedBot: this.isAllowedBot(logData.userAgent)
            }
        };
    }
    /**
     * ヘルパーメソッド
     */
    isAllowedBot(userAgent) {
        const allowedBots = [
            /googlebot/i, /bingbot/i, /yahoo/i, /duckduckbot/i,
            /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
            /slackbot/i, /telegrambot/i, /whatsapp/i
        ];
        return allowedBots.some(pattern => pattern.test(userAgent));
    }
    createDetection(rule, logData, evidence) {
        return {
            id: `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: rule.type,
            threatLevel: rule.severity,
            confidence: this.calculateConfidence(rule, evidence),
            timestamp: new Date(),
            ipAddress: logData.ipAddress,
            userAgent: logData.userAgent,
            userId: logData.userId,
            endpoint: logData.path,
            description: this.generateDescription(rule, evidence),
            evidence,
            riskScore: this.calculateRiskScore(rule, evidence),
        };
    }
    calculateConfidence(rule, evidence) {
        // 基本信頼度を設定
        let confidence = 70;
        // エビデンスの質に基づいて調整
        if (evidence.patternCount > 2)
            confidence += 15;
        if (evidence.matches && evidence.matches.length > 0)
            confidence += 10;
        if (evidence.requestCount && evidence.requestCount > rule.threshold * 2)
            confidence += 10;
        return Math.min(confidence, 100);
    }
    generateDescription(rule, evidence) {
        switch (rule.type) {
            case AnomalyType.RATE_LIMIT_VIOLATION:
                return `Rate limit exceeded: ${evidence.requestCount} requests in ${evidence.timeWindow} minutes (threshold: ${evidence.threshold})`;
            case AnomalyType.SQL_INJECTION:
                return `SQL injection attempt detected: ${evidence.patternCount} malicious patterns found`;
            case AnomalyType.XSS_ATTEMPT:
                return `XSS attack attempt detected: ${evidence.patternCount} malicious patterns found`;
            case AnomalyType.BRUTE_FORCE:
                return `Brute force attack detected: ${evidence.failureCount} authentication failures in ${evidence.timeWindow} minutes`;
            case AnomalyType.SCANNER_ACTIVITY:
                return `Scanner activity detected: ${evidence.uniquePaths} unique paths accessed with ${evidence.notFoundCount} 404 errors`;
            default:
                return `${rule.type} detected with ${JSON.stringify(evidence)}`;
        }
    }
    calculateRiskScore(rule, evidence) {
        let score = 0;
        switch (rule.severity) {
            case ThreatLevel.CRITICAL:
                score += 80;
                break;
            case ThreatLevel.HIGH:
                score += 60;
                break;
            case ThreatLevel.MEDIUM:
                score += 40;
                break;
            case ThreatLevel.LOW:
                score += 20;
                break;
        }
        // エビデンスに基づく追加スコア
        if (evidence.patternCount > 3)
            score += 15;
        if (evidence.requestCount && evidence.requestCount > evidence.threshold * 3)
            score += 10;
        return Math.min(score, 100);
    }
    /**
     * 初期化とユーティリティメソッド
     */
    initializeDefaultRules() {
        const defaultRules = [
            {
                id: 'rate_limit',
                name: 'Rate Limit Violation',
                type: AnomalyType.RATE_LIMIT_VIOLATION,
                enabled: true,
                threshold: 100,
                timeWindow: 1,
                severity: ThreatLevel.MEDIUM
            },
            {
                id: 'suspicious_ua',
                name: 'Suspicious User Agent',
                type: AnomalyType.SUSPICIOUS_USER_AGENT,
                enabled: true,
                threshold: 1,
                timeWindow: 1,
                severity: ThreatLevel.LOW
            },
            {
                id: 'sql_injection',
                name: 'SQL Injection Attack',
                type: AnomalyType.SQL_INJECTION,
                enabled: true,
                threshold: 1,
                timeWindow: 1,
                severity: ThreatLevel.HIGH
            },
            {
                id: 'xss_attempt',
                name: 'XSS Attack Attempt',
                type: AnomalyType.XSS_ATTEMPT,
                enabled: true,
                threshold: 1,
                timeWindow: 1,
                severity: ThreatLevel.HIGH
            },
            {
                id: 'brute_force',
                name: 'Brute Force Attack',
                type: AnomalyType.BRUTE_FORCE,
                enabled: true,
                threshold: 5,
                timeWindow: 5,
                severity: ThreatLevel.HIGH
            },
            {
                id: 'scanner_activity',
                name: 'Scanner Activity',
                type: AnomalyType.SCANNER_ACTIVITY,
                enabled: true,
                threshold: 20,
                timeWindow: 5,
                severity: ThreatLevel.MEDIUM
            }
        ];
        defaultRules.forEach(rule => {
            this.detectionRules.set(rule.id, rule);
        });
    }
    async recordDetections(detections) {
        for (const detection of detections) {
            try {
                await prisma.securityLog.create({
                    data: {
                        eventType: this.mapAnomalyTypeToSecurityEvent(detection.type),
                        severity: detection.threatLevel.toUpperCase(),
                        ipAddress: detection.ipAddress,
                        userAgent: detection.userAgent || '',
                        userId: detection.userId,
                        url: detection.endpoint,
                        method: 'UNKNOWN',
                        detectionEngine: 'ANOMALY_DETECTION',
                        confidence: detection.confidence,
                        riskScore: detection.riskScore,
                        metadata: JSON.stringify({
                            detectionId: detection.id,
                            description: detection.description,
                            evidence: detection.evidence
                        }),
                    },
                });
            }
            catch (error) {
                console.error('Failed to record detection:', error);
            }
        }
    }
    mapAnomalyTypeToSecurityEvent(type) {
        switch (type) {
            case AnomalyType.SQL_INJECTION: return 'SQL_INJECTION';
            case AnomalyType.XSS_ATTEMPT: return 'XSS_ATTACK';
            case AnomalyType.BRUTE_FORCE: return 'BRUTE_FORCE';
            default: return 'SUSPICIOUS_ACTIVITY';
        }
    }
    updateDetectionHistory(detections) {
        this.detectionHistory.push(...detections);
        // 履歴を最新1000件に制限
        if (this.detectionHistory.length > 1000) {
            this.detectionHistory = this.detectionHistory.slice(-1000);
        }
    }
    startPeriodicCleanup() {
        // 古いアクティビティデータを定期的にクリーンアップ
        setInterval(() => {
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24時間
            for (const [key, activities] of this.recentActivity.entries()) {
                const filtered = activities.filter(activity => now - activity.timestamp < maxAge);
                if (filtered.length === 0) {
                    this.recentActivity.delete(key);
                }
                else {
                    this.recentActivity.set(key, filtered);
                }
            }
        }, 60 * 60 * 1000); // 1時間ごと
    }
    /**
     * 公開メソッド
     */
    getDetectionHistory() {
        return this.detectionHistory.slice(-100); // 最新100件
    }
    getDetectionRules() {
        return Array.from(this.detectionRules.values());
    }
    updateDetectionRule(ruleId, updates) {
        const rule = this.detectionRules.get(ruleId);
        if (!rule)
            return false;
        this.detectionRules.set(ruleId, { ...rule, ...updates });
        return true;
    }
    addDetectionRule(rule) {
        this.detectionRules.set(rule.id, rule);
    }
    removeDetectionRule(ruleId) {
        return this.detectionRules.delete(ruleId);
    }
}
// シングルトンインスタンス
exports.anomalyDetectionService = new AnomalyDetectionService();
exports.default = AnomalyDetectionService;
