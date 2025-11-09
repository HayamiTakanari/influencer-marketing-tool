"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityStats = exports.handleXSSAttempt = exports.handleCSPReport = void 0;
var xss_protection_1 = require("../utils/xss-protection");
/**
 * CSP違反レポートの処理
 */
var handleCSPReport = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var report, clientIP, userAgent, sanitizedReport, violation, severity, error_1;
    var _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 2, , 3]);
                report = req.body;
                clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                userAgent = req.get('User-Agent') || 'unknown';
                sanitizedReport = (0, xss_protection_1.sanitizeJsonData)(report);
                // ログ記録
                console.warn('CSP Violation Report:', {
                    timestamp: new Date().toISOString(),
                    clientIP: clientIP,
                    userAgent: userAgent,
                    report: sanitizedReport,
                    headers: {
                        referer: req.get('Referer'),
                        origin: req.get('Origin')
                    }
                });
                violation = sanitizedReport['csp-report'];
                severity = 'low';
                if (violation) {
                    // スクリプトインジェクション等の高リスク違反
                    if (((_a = violation['violated-directive']) === null || _a === void 0 ? void 0 : _a.includes('script-src')) ||
                        ((_b = violation['blocked-uri']) === null || _b === void 0 ? void 0 : _b.includes('javascript:')) ||
                        ((_c = violation['blocked-uri']) === null || _c === void 0 ? void 0 : _c.includes('data:text/html'))) {
                        severity = 'high';
                    }
                    // インラインスタイル等の中リスク違反
                    else if (((_d = violation['violated-directive']) === null || _d === void 0 ? void 0 : _d.includes('style-src')) ||
                        ((_e = violation['violated-directive']) === null || _e === void 0 ? void 0 : _e.includes('img-src'))) {
                        severity = 'medium';
                    }
                }
                // 高リスクの場合は即座にアラート
                if (severity === 'high') {
                    console.error('HIGH RISK CSP Violation detected:', {
                        clientIP: clientIP,
                        blockedUri: violation === null || violation === void 0 ? void 0 : violation['blocked-uri'],
                        violatedDirective: violation === null || violation === void 0 ? void 0 : violation['violated-directive'],
                        documentUri: violation === null || violation === void 0 ? void 0 : violation['document-uri']
                    });
                    // 本番環境では外部監視システムに通知
                    if (process.env.NODE_ENV === 'production') {
                        // await notifySecurityTeam(violation, clientIP);
                    }
                }
                // 統計情報の更新（実装例）
                return [4 /*yield*/, updateCSPViolationStats((violation === null || violation === void 0 ? void 0 : violation['violated-directive']) || 'unknown', severity)];
            case 1:
                // 統計情報の更新（実装例）
                _f.sent();
                res.status(204).send(); // No Content
                return [3 /*break*/, 3];
            case 2:
                error_1 = _f.sent();
                console.error('Error processing CSP report:', error_1);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleCSPReport = handleCSPReport;
/**
 * XSS攻撃試行の報告処理
 */
var handleXSSAttempt = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, input, location_1, userId, clientIP, userAgent, sanitizedData, attackPatterns, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, input = _a.input, location_1 = _a.location, userId = _a.userId;
                clientIP = req.ip || req.connection.remoteAddress || 'unknown';
                userAgent = req.get('User-Agent') || 'unknown';
                sanitizedData = {
                    input: typeof input === 'string' ? input.substring(0, 500) : 'unknown', // 長さ制限
                    location: typeof location_1 === 'string' ? location_1.substring(0, 200) : 'unknown',
                    userId: typeof userId === 'string' ? userId : null
                };
                // 重要なセキュリティインシデントとしてログ記録
                console.error('XSS Attack Attempt Detected:', {
                    timestamp: new Date().toISOString(),
                    clientIP: clientIP,
                    userAgent: userAgent,
                    userId: sanitizedData.userId,
                    location: sanitizedData.location,
                    inputSample: sanitizedData.input,
                    headers: {
                        referer: req.get('Referer'),
                        origin: req.get('Origin')
                    }
                });
                attackPatterns = analyzeXSSPattern(sanitizedData.input);
                // 統計情報の更新
                return [4 /*yield*/, updateXSSAttemptStats(attackPatterns, clientIP)];
            case 1:
                // 統計情報の更新
                _b.sent();
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
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Error processing XSS attempt report:', error_2);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleXSSAttempt = handleXSSAttempt;
/**
 * セキュリティ統計情報の取得（管理者用）
 */
var getSecurityStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, stats, error_3;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 9, , 10]);
                user = req.user;
                if (!user || user.role !== 'ADMIN') {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return [2 /*return*/];
                }
                _a = {};
                _b = {};
                return [4 /*yield*/, getCSPViolationCount()];
            case 1:
                _b.total = _d.sent();
                return [4 /*yield*/, getCSPViolationsByDirective()];
            case 2:
                _b.byDirective = _d.sent();
                return [4 /*yield*/, getRecentCSPViolations(24)]; // 24時間以内
            case 3:
                _a.cspViolations = (_b.recent = _d.sent() // 24時間以内
                ,
                    _b);
                _c = {};
                return [4 /*yield*/, getXSSAttemptCount()];
            case 4:
                _c.total = _d.sent();
                return [4 /*yield*/, getXSSAttemptsByPattern()];
            case 5:
                _c.byPattern = _d.sent();
                return [4 /*yield*/, getRecentXSSAttempts(24)];
            case 6:
                _a.xssAttempts = (_c.recent = _d.sent(),
                    _c);
                return [4 /*yield*/, getBlockedIPs()];
            case 7:
                _a.blockedIPs = _d.sent();
                return [4 /*yield*/, getTopAttackers()];
            case 8:
                stats = (_a.topAttackers = _d.sent(),
                    _a);
                res.json({
                    success: true,
                    data: stats,
                    generatedAt: new Date().toISOString()
                });
                return [3 /*break*/, 10];
            case 9:
                error_3 = _d.sent();
                console.error('Error getting security stats:', error_3);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.getSecurityStats = getSecurityStats;
/**
 * XSS攻撃パターンの分析
 */
function analyzeXSSPattern(input) {
    var patterns = [];
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
function updateCSPViolationStats(directive, severity) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // 実際の実装では、データベースやRedis等に統計情報を保存
            console.log("CSP Violation Stats Updated: ".concat(directive, " (").concat(severity, ")"));
            return [2 /*return*/];
        });
    });
}
/**
 * XSS攻撃試行統計の更新（実装例）
 */
function updateXSSAttemptStats(patterns, clientIP) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // 実際の実装では、データベースやRedis等に統計情報を保存
            console.log("XSS Attempt Stats Updated: ".concat(patterns.join(', '), " from ").concat(clientIP));
            return [2 /*return*/];
        });
    });
}
/**
 * 統計情報取得関数群（実装例）
 */
function getCSPViolationCount() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // データベースから実際の数値を取得
            return [2 /*return*/, 0];
        });
    });
}
function getCSPViolationsByDirective() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        });
    });
}
function getRecentCSPViolations(hours) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, []];
        });
    });
}
function getXSSAttemptCount() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, 0];
        });
    });
}
function getXSSAttemptsByPattern() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, {}];
        });
    });
}
function getRecentXSSAttempts(hours) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, []];
        });
    });
}
function getBlockedIPs() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, []];
        });
    });
}
function getTopAttackers() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, []];
        });
    });
}
