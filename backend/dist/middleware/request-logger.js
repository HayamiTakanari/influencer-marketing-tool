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
exports.requestLoggingMiddleware = requestLoggingMiddleware;
exports.requestMetricsMiddleware = requestMetricsMiddleware;
exports.getCurrentMetrics = getCurrentMetrics;
const client_1 = require("@prisma/client");
const sentry_1 = require("../config/sentry");
const security_orchestrator_service_1 = require("../services/security-orchestrator.service");
const prisma = new client_1.PrismaClient();
/**
 * リクエストログ収集ミドルウェア
 */
function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const timestamp = new Date();
    // リクエストIDをレスポンスヘッダーに追加
    res.setHeader('X-Request-ID', requestId);
    // オリジナルのsendメソッドをオーバーライド
    const originalSend = res.send;
    let responseSize = 0;
    res.send = function (data) {
        responseSize = Buffer.byteLength(data || '', 'utf8');
        return originalSend.call(this, data);
    };
    // レスポンス終了時の処理
    res.on('finish', async () => {
        try {
            const responseTime = Date.now() - startTime;
            const logData = {
                timestamp,
                requestId,
                method: req.method,
                url: req.originalUrl,
                path: req.path,
                query: req.query,
                headers: sanitizeHeaders(req.headers),
                ipAddress: getClientIP(req),
                userAgent: req.get('User-Agent') || '',
                referer: req.get('Referer'),
                origin: req.get('Origin'),
                userId: req.user?.id,
                sessionId: req.sessionID || req.get('X-Session-ID'),
                userRole: req.user?.role,
                statusCode: res.statusCode,
                responseTime,
                responseSize,
                isBot: detectBot(req.get('User-Agent') || ''),
                isSuspicious: await detectSuspiciousActivity(req),
            };
            // 地理的位置情報の取得（非同期）
            try {
                logData.geoLocation = await getGeoLocation(logData.ipAddress);
            }
            catch (geoError) {
                // 地理的位置情報の取得に失敗してもログ記録は継続
            }
            // ログの記録
            await recordRequestLog(logData);
            // 異常検知の実行
            await checkForAnomalies(logData);
        }
        catch (error) {
            console.error('Request logging error:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'request_logging', issue: 'logging_failure' },
                level: 'warning'
            });
        }
    });
    next();
}
/**
 * リクエストメトリクス取得ミドルウェア
 */
function requestMetricsMiddleware(req, res, next) {
    // プロメテウス形式のメトリクス収集
    const startTime = Date.now();
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        // メトリクスの更新
        updateRequestMetrics({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
            ipAddress: getClientIP(req),
            userAgent: req.get('User-Agent') || '',
        });
    });
    next();
}
/**
 * 構造化ログの記録
 */
async function recordRequestLog(logData) {
    try {
        // コンソールログ（開発環境）
        if (process.env.NODE_ENV === 'development') {
            console.log(JSON.stringify({
                level: 'info',
                message: 'HTTP Request',
                ...logData,
            }, null, 2));
        }
        // データベースへの記録（重要なログのみ）
        if (shouldPersistLog(logData)) {
            await persistLogToDatabase(logData);
        }
        // 外部ログサービスへの送信
        await sendToLogService(logData);
    }
    catch (error) {
        console.error('Failed to record request log:', error);
    }
}
/**
 * データベースにログを永続化
 */
async function persistLogToDatabase(logData) {
    try {
        // SecurityLogテーブルを使用してセキュリティ関連のリクエストを記録
        if (logData.isSuspicious || logData.statusCode >= 400) {
            await prisma.securityLog.create({
                data: {
                    eventType: getSecurityEventType(logData),
                    severity: getSecuritySeverity(logData),
                    ipAddress: logData.ipAddress,
                    userAgent: logData.userAgent,
                    userId: logData.userId,
                    url: logData.url,
                    method: logData.method,
                    payload: JSON.stringify({
                        query: logData.query,
                        headers: logData.headers,
                    }),
                    detectionEngine: 'REQUEST_LOGGER',
                    confidence: logData.isSuspicious ? 80 : 60,
                    riskScore: calculateRiskScore(logData),
                    metadata: JSON.stringify({
                        requestId: logData.requestId,
                        responseTime: logData.responseTime,
                        statusCode: logData.statusCode,
                        geoLocation: logData.geoLocation,
                    }),
                },
            });
        }
    }
    catch (error) {
        console.error('Failed to persist log to database:', error);
    }
}
/**
 * 外部ログサービスへの送信
 */
async function sendToLogService(logData) {
    // ElasticSearch, Datadog, Splunk等への送信
    // 実装例はプレースホルダー
    if (process.env.ELASTICSEARCH_URL) {
        // await sendToElasticsearch(logData);
    }
    if (process.env.DATADOG_API_KEY) {
        // await sendToDatadog(logData);
    }
}
/**
 * ボット検出
 */
function detectBot(userAgent) {
    const botPatterns = [
        /bot/i, /crawl/i, /spider/i, /scraper/i,
        /googlebot/i, /bingbot/i, /yahoo/i, /facebookexternalhit/i,
        /twitterbot/i, /linkedinbot/i, /slackbot/i,
        /whatsapp/i, /telegram/i, /discord/i,
        /curl/i, /wget/i, /python-requests/i, /java/i,
        /postman/i, /insomnia/i, /httpie/i,
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
}
/**
 * 疑わしい活動の検出
 */
async function detectSuspiciousActivity(req) {
    const suspiciousIndicators = [];
    // 1. 異常なUser-Agent
    const userAgent = req.get('User-Agent') || '';
    if (userAgent.length < 10 || userAgent.length > 1000) {
        suspiciousIndicators.push('abnormal_user_agent');
    }
    // 2. 空のReferrer（直接アクセス）
    if (!req.get('Referer') && req.method === 'POST') {
        suspiciousIndicators.push('missing_referrer');
    }
    // 3. 異常なヘッダー
    const headers = req.headers;
    if (!headers.accept || !headers['accept-language']) {
        suspiciousIndicators.push('missing_standard_headers');
    }
    // 4. SQLインジェクション試行の可能性
    const queryString = req.originalUrl;
    const sqlPatterns = [
        /union\s+select/i, /insert\s+into/i, /delete\s+from/i,
        /drop\s+table/i, /update\s+set/i, /exec\s*\(/i,
        /script\s*>/i, /javascript:/i, /vbscript:/i,
    ];
    if (sqlPatterns.some(pattern => pattern.test(queryString))) {
        suspiciousIndicators.push('sql_injection_attempt');
    }
    // 5. 異常に長いURL
    if (queryString.length > 2000) {
        suspiciousIndicators.push('abnormally_long_url');
    }
    // 6. 複数の特殊文字
    const specialCharCount = (queryString.match(/[<>'"();{}]/g) || []).length;
    if (specialCharCount > 10) {
        suspiciousIndicators.push('excessive_special_characters');
    }
    return suspiciousIndicators.length >= 2;
}
/**
 * 地理的位置情報の取得
 */
async function getGeoLocation(ipAddress) {
    // ローカルIPやプライベートIPの場合はスキップ
    if (isPrivateIP(ipAddress)) {
        return {};
    }
    try {
        // 無料のGeoIPサービスを使用（実際の実装では有料サービスを推奨）
        const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,regionName,city`);
        const data = await response.json();
        return {
            country: data.country,
            region: data.regionName,
            city: data.city,
        };
    }
    catch (error) {
        return {};
    }
}
/**
 * ユーティリティ関数群
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function getClientIP(req) {
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.get('X-Real-IP') ||
        req.get('X-Client-IP') ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown';
}
function sanitizeHeaders(headers) {
    const sanitized = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    Object.entries(headers).forEach(([key, value]) => {
        if (sensitiveHeaders.includes(key.toLowerCase())) {
            sanitized[key] = '***';
        }
        else {
            sanitized[key] = Array.isArray(value) ? value.join(', ') : String(value);
        }
    });
    return sanitized;
}
function isPrivateIP(ip) {
    const privateRanges = [
        /^127\./, // localhost
        /^192\.168\./, // private class C
        /^10\./, // private class A
        /^172\.(1[6-9]|2[0-9]|3[01])\./, // private class B
        /^::1$/, // IPv6 localhost
        /^fe80:/, // IPv6 link-local
    ];
    return privateRanges.some(range => range.test(ip)) || ip === 'unknown';
}
function shouldPersistLog(logData) {
    return (logData.isSuspicious ||
        logData.statusCode >= 400 ||
        logData.responseTime > 5000 ||
        logData.path.includes('/api/auth') ||
        logData.path.includes('/api/admin'));
}
function getSecurityEventType(logData) {
    if (logData.statusCode === 401)
        return 'AUTHENTICATION_FAILURE';
    if (logData.statusCode === 403)
        return 'AUTHORIZATION_FAILURE';
    if (logData.statusCode >= 500)
        return 'SUSPICIOUS_ACTIVITY';
    if (logData.isSuspicious)
        return 'SUSPICIOUS_ACTIVITY';
    return 'SUSPICIOUS_ACTIVITY';
}
function getSecuritySeverity(logData) {
    if (logData.isSuspicious)
        return 'HIGH';
    if (logData.statusCode >= 500)
        return 'MEDIUM';
    if (logData.statusCode >= 400)
        return 'LOW';
    return 'LOW';
}
function calculateRiskScore(logData) {
    let score = 0;
    if (logData.isSuspicious)
        score += 50;
    if (logData.statusCode >= 500)
        score += 30;
    if (logData.statusCode >= 400)
        score += 20;
    if (logData.responseTime > 5000)
        score += 10;
    if (logData.isBot)
        score += 5;
    return Math.min(score, 100);
}
// グローバルメトリクス管理
const globalMetrics = {
    requests: new Map(),
    errors: new Map(),
    responseTimes: new Map(),
    ips: new Set(),
    endpoints: new Map(),
    userAgents: new Map(),
    suspiciousCount: 0,
};
function updateRequestMetrics(data) {
    const endpoint = `${data.method} ${data.path}`;
    // リクエスト数の更新
    globalMetrics.requests.set(endpoint, (globalMetrics.requests.get(endpoint) || 0) + 1);
    // エラー数の更新
    if (data.statusCode >= 400) {
        globalMetrics.errors.set(endpoint, (globalMetrics.errors.get(endpoint) || 0) + 1);
    }
    // レスポンス時間の記録
    if (!globalMetrics.responseTimes.has(endpoint)) {
        globalMetrics.responseTimes.set(endpoint, []);
    }
    globalMetrics.responseTimes.get(endpoint).push(data.responseTime);
    // ユニークIP
    globalMetrics.ips.add(data.ipAddress);
    // エンドポイント統計
    globalMetrics.endpoints.set(endpoint, (globalMetrics.endpoints.get(endpoint) || 0) + 1);
    // User-Agent統計
    const shortUA = data.userAgent.substring(0, 100);
    globalMetrics.userAgents.set(shortUA, (globalMetrics.userAgents.get(shortUA) || 0) + 1);
}
/**
 * 統合セキュリティ分析の実行
 */
async function checkForAnomalies(logData) {
    try {
        // 疑わしい活動のカウント（従来の機能を維持）
        if (logData.isSuspicious) {
            globalMetrics.suspiciousCount++;
        }
        // 高リスクリクエストは即座に分析、それ以外はキューに追加
        if (await shouldRunImmediateAnalysis(logData)) {
            // 即座にセキュリティ分析を実行
            const analysisResult = await security_orchestrator_service_1.securityOrchestratorService.analyzeRequest(logData);
            console.log(`Immediate security analysis completed for ${logData.ipAddress}:`, {
                requestId: logData.requestId,
                riskLevel: analysisResult.riskLevel,
                riskScore: analysisResult.totalRiskScore,
                detectionCount: analysisResult.detectionCount,
                shouldBlock: analysisResult.shouldBlock,
                escalationRequired: analysisResult.escalationRequired
            });
            // クリティカルな脅威の場合は追加ログ
            if (analysisResult.riskLevel === 'CRITICAL') {
                console.error('CRITICAL SECURITY THREAT DETECTED:', {
                    threatId: `${logData.requestId}_${Date.now()}`,
                    ipAddress: logData.ipAddress,
                    endpoint: logData.path,
                    userAgent: logData.userAgent,
                    riskScore: analysisResult.totalRiskScore,
                    detections: analysisResult.detectionCount,
                    recommendedActions: analysisResult.recommendedActions
                });
            }
        }
        else {
            // 通常のリクエストはバックグラウンドで分析
            await security_orchestrator_service_1.securityOrchestratorService.queueRequestForAnalysis(logData);
        }
    }
    catch (error) {
        console.error('Security analysis failed:', error);
        (0, sentry_1.captureError)(error, {
            tags: { category: 'security_analysis', issue: 'analysis_failure' },
            level: 'warning',
            extra: {
                requestId: logData.requestId,
                ipAddress: logData.ipAddress,
                path: logData.path
            }
        });
        // エラー時のフォールバック処理
        if (logData.isSuspicious || await shouldTriggerImmediateAlert(logData)) {
            console.warn('Security analysis failed, using fallback detection:', {
                requestId: logData.requestId,
                ipAddress: logData.ipAddress,
                path: logData.path,
                userAgent: logData.userAgent,
                reason: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
async function shouldRunImmediateAnalysis(logData) {
    // 即座に分析すべきリクエストの条件
    // 1. 疑わしい活動として既に検出されている
    if (logData.isSuspicious) {
        return true;
    }
    // 2. 重要なエンドポイントへのアクセス
    const criticalEndpoints = ['/api/auth', '/api/admin', '/api/payments', '/api/user'];
    if (criticalEndpoints.some(endpoint => logData.path.startsWith(endpoint))) {
        return true;
    }
    // 3. エラーレスポンス
    if (logData.statusCode >= 400) {
        return true;
    }
    // 4. 異常に長いレスポンス時間
    if (logData.responseTime > 5000) {
        return true;
    }
    // 5. ボット活動（許可されていないボット）
    if (logData.isBot && !isAllowedBot(logData.userAgent)) {
        return true;
    }
    // 6. 高いベースラインリスクスコア
    if (calculateRiskScore(logData) >= 60) {
        return true;
    }
    // 7. 異常なHTTPメソッド
    const suspiciousMethods = ['TRACE', 'CONNECT', 'PATCH'];
    if (suspiciousMethods.includes(logData.method)) {
        return true;
    }
    // 8. 異常に大きなペイロード
    if (logData.responseSize > 10 * 1024 * 1024) { // 10MB
        return true;
    }
    return false;
}
async function shouldTriggerImmediateAlert(logData) {
    // レガシー関数（フォールバック用）
    const criticalEndpoints = ['/api/auth', '/api/admin', '/api/payments'];
    if (criticalEndpoints.some(endpoint => logData.path.startsWith(endpoint))) {
        return true;
    }
    if (calculateRiskScore(logData) >= 80) {
        return true;
    }
    return false;
}
function isAllowedBot(userAgent) {
    const allowedBots = [
        /googlebot/i, /bingbot/i, /yahoo/i, /duckduckbot/i,
        /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
        /slackbot/i, /telegrambot/i, /whatsapp/i
    ];
    return allowedBots.some(pattern => pattern.test(userAgent));
}
/**
 * メトリクス取得API用の関数
 */
function getCurrentMetrics() {
    const totalRequests = Array.from(globalMetrics.requests.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(globalMetrics.errors.values()).reduce((a, b) => a + b, 0);
    const allResponseTimes = Array.from(globalMetrics.responseTimes.values()).flat();
    const averageResponseTime = allResponseTimes.length > 0
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
        : 0;
    const topEndpoints = Array.from(globalMetrics.endpoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));
    const topUserAgents = Array.from(globalMetrics.userAgents.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userAgent, count]) => ({ userAgent, count }));
    return {
        totalRequests,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        averageResponseTime,
        uniqueIPs: globalMetrics.ips.size,
        topEndpoints,
        topUserAgents,
        suspiciousActivity: globalMetrics.suspiciousCount,
    };
}
exports.default = {
    requestLoggingMiddleware,
    requestMetricsMiddleware,
    getCurrentMetrics,
};
//# sourceMappingURL=request-logger.js.map