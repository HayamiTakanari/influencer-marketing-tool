"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityStats = exports.handleXSSAttempt = exports.handleCSPReport = void 0;
const xss_protection_1 = require("../utils/xss-protection");
/**
 * CSP違反レポートの処理
 */
const handleCSPReport = async (req, res) => {
    try {
        const report = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        // レポートデータのサニタイゼーション
        const sanitizedReport = (0, xss_protection_1.sanitizeJsonData)(report);
        // ログ記録
        console.warn('CSP Violation Report:', {
            timestamp: new Date().toISOString(),
            clientIP,
            userAgent,
            report: sanitizedReport,
            headers: {
                referer: req.get('Referer'),
                origin: req.get('Origin')
            }
        });
        // 重要度の判定
        const violation = sanitizedReport['csp-report'];
        let severity = 'low';
        if (violation) {
            // スクリプトインジェクション等の高リスク違反
            if (violation['violated-directive']?.includes('script-src') ||
                violation['blocked-uri']?.includes('javascript:') ||
                violation['blocked-uri']?.includes('data:text/html')) {
                severity = 'high';
            }
            // インラインスタイル等の中リスク違反
            else if (violation['violated-directive']?.includes('style-src') ||
                violation['violated-directive']?.includes('img-src')) {
                severity = 'medium';
            }
        }
        // 高リスクの場合は即座にアラート
        if (severity === 'high') {
            console.error('HIGH RISK CSP Violation detected:', {
                clientIP,
                blockedUri: violation?.['blocked-uri'],
                violatedDirective: violation?.['violated-directive'],
                documentUri: violation?.['document-uri']
            });
            // 本番環境では外部監視システムに通知
            if (process.env.NODE_ENV === 'production') {
                // await notifySecurityTeam(violation, clientIP);
            }
        }
        // 統計情報の更新（実装例）
        await updateCSPViolationStats(violation?.['violated-directive'] || 'unknown', severity);
        res.status(204).send(); // No Content
    }
    catch (error) {
        console.error('Error processing CSP report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleCSPReport = handleCSPReport;
/**
 * XSS攻撃試行の報告処理
 */
const handleXSSAttempt = async (req, res) => {
    try {
        const { input, location, userId } = req.body;
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        // 入力データのサニタイゼーション
        const sanitizedData = {
            input: typeof input === 'string' ? input.substring(0, 500) : 'unknown', // 長さ制限
            location: typeof location === 'string' ? location.substring(0, 200) : 'unknown',
            userId: typeof userId === 'string' ? userId : null
        };
        // 重要なセキュリティインシデントとしてログ記録
        console.error('XSS Attack Attempt Detected:', {
            timestamp: new Date().toISOString(),
            clientIP,
            userAgent,
            userId: sanitizedData.userId,
            location: sanitizedData.location,
            inputSample: sanitizedData.input,
            headers: {
                referer: req.get('Referer'),
                origin: req.get('Origin')
            }
        });
        // 攻撃パターンの分析
        const attackPatterns = analyzeXSSPattern(sanitizedData.input);
        // 統計情報の更新
        await updateXSSAttemptStats(attackPatterns, clientIP);
        // 本番環境では即座にセキュリティチームに通知
        if (process.env.NODE_ENV === 'production') {
            // await notifySecurityTeam({
            //   type: 'XSS_ATTEMPT',
            //   clientIP,
            //   userId: sanitizedData.userId,
            //   patterns: attackPatterns
            // });
        }
        res.status(204).send(); // No Content
    }
    catch (error) {
        console.error('Error processing XSS attempt report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.handleXSSAttempt = handleXSSAttempt;
/**
 * セキュリティ統計情報の取得（管理者用）
 */
const getSecurityStats = async (req, res) => {
    try {
        // 管理者権限チェック
        const user = req.user;
        if (!user || user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        // 統計情報の取得（実装例）
        const stats = {
            cspViolations: {
                total: await getCSPViolationCount(),
                byDirective: await getCSPViolationsByDirective(),
                recent: await getRecentCSPViolations(24) // 24時間以内
            },
            xssAttempts: {
                total: await getXSSAttemptCount(),
                byPattern: await getXSSAttemptsByPattern(),
                recent: await getRecentXSSAttempts(24)
            },
            blockedIPs: await getBlockedIPs(),
            topAttackers: await getTopAttackers()
        };
        res.json({
            success: true,
            data: stats,
            generatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error getting security stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSecurityStats = getSecurityStats;
/**
 * XSS攻撃パターンの分析
 */
function analyzeXSSPattern(input) {
    const patterns = [];
    if (input.includes('<script'))
        patterns.push('script_tag');
    if (input.includes('javascript:'))
        patterns.push('javascript_protocol');
    if (input.includes('eval('))
        patterns.push('eval_function');
    if (input.includes('innerHTML'))
        patterns.push('inner_html');
    if (input.includes('document.write'))
        patterns.push('document_write');
    if (input.includes('onload='))
        patterns.push('event_handler');
    if (input.includes('onerror='))
        patterns.push('event_handler');
    if (input.includes('<iframe'))
        patterns.push('iframe_tag');
    if (input.includes('<object'))
        patterns.push('object_tag');
    if (input.includes('vbscript:'))
        patterns.push('vbscript_protocol');
    return patterns;
}
/**
 * CSP違反統計の更新（実装例）
 */
async function updateCSPViolationStats(directive, severity) {
    // 実際の実装では、データベースやRedis等に統計情報を保存
    console.log(`CSP Violation Stats Updated: ${directive} (${severity})`);
}
/**
 * XSS攻撃試行統計の更新（実装例）
 */
async function updateXSSAttemptStats(patterns, clientIP) {
    // 実際の実装では、データベースやRedis等に統計情報を保存
    console.log(`XSS Attempt Stats Updated: ${patterns.join(', ')} from ${clientIP}`);
}
/**
 * 統計情報取得関数群（実装例）
 */
async function getCSPViolationCount() {
    // データベースから実際の数値を取得
    return 0;
}
async function getCSPViolationsByDirective() {
    return {};
}
async function getRecentCSPViolations(hours) {
    return [];
}
async function getXSSAttemptCount() {
    return 0;
}
async function getXSSAttemptsByPattern() {
    return {};
}
async function getRecentXSSAttempts(hours) {
    return [];
}
async function getBlockedIPs() {
    return [];
}
async function getTopAttackers() {
    return [];
}
