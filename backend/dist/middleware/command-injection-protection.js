"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.preventSystemCommands = exports.validateFieldTypes = exports.protectFromCommandInjection = void 0;
/**
 * コマンドインジェクション対策のミドルウェア
 * ユーザー入力とシステム命令を明確に分離し、危険なパターンをブロック
 */
// 危険なコマンドパターンの定義
var DANGEROUS_COMMAND_PATTERNS = [
    // System commands
    /(\b(rm|del|delete|format|fdisk|shutdown|reboot|halt|init|kill|killall|pkill|ps|top|netstat|ifconfig|ping|curl|wget|nc|telnet|ssh|ftp|tftp)\b)/i,
    // Shell operators
    /[;&|`$(){}[\]\\]/,
    // Path traversal
    /\.\.(\/|\\)/,
    // File operations
    /(\/etc\/|\/bin\/|\/usr\/|\/var\/|\/tmp\/|\/root\/|C:\\|D:\\)/i,
    // Script injections
    /<script[^>]*>.*?<\/script>/i,
    // SQL injection patterns (additional layer)
    /(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\s+/i,
    // Command concatenation
    /(\|\||&&|;|\|)/,
    // Environment variables
    /\$\{.*\}|\$[A-Z_][A-Z0-9_]*/i,
    // Hex/Base64 encoded potentially dangerous content
    /(%[0-9a-f]{2}){3,}/i,
];
// 許可される文字パターン（ホワイトリスト方式）
var SAFE_PATTERNS = {
    // 一般的なテキスト（日本語、英数字、基本的な記号）
    text: /^[\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u002B\u002D\u002E\u0021\u003F\u0028\u0029\u002C\u003A]*$/,
    // メールアドレス
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    // URL（制限付き）
    url: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/,
    // ファイル名
    filename: /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]{1,10}$/,
    // 数値
    number: /^-?\d+(\.\d+)?$/,
    // 日付
    date: /^\d{4}-\d{2}-\d{2}$/,
    // CUID (Prismaで使用)
    cuid: /^c[a-z0-9]{24}$/,
};
/**
 * 入力値が危険なコマンドパターンを含んでいないかチェック
 */
function containsDangerousPattern(input) {
    return DANGEROUS_COMMAND_PATTERNS.some(function (pattern) { return pattern.test(input); });
}
/**
 * 入力値が安全なパターンに合致するかチェック
 */
function matchesSafePattern(input, type) {
    return SAFE_PATTERNS[type].test(input);
}
/**
 * 文字列を安全にエスケープ
 */
function escapeInput(input) {
    return input
        .replace(/[<>&"']/g, function (match) {
        var escapeChars = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return escapeChars[match];
    })
        // コマンドインジェクション対策
        .replace(/[;&|`$(){}[\]\\]/g, '')
        // パストラバーサル対策
        .replace(/\.\.(\/|\\)/g, '');
}
/**
 * オブジェクトを再帰的にサニタイズ
 */
function sanitizeObject(obj, depth) {
    if (depth === void 0) { depth = 0; }
    // 再帰の深さ制限
    if (depth > 10) {
        throw new Error('Object depth limit exceeded');
    }
    if (typeof obj === 'string') {
        // 危険なパターンをチェック
        if (containsDangerousPattern(obj)) {
            throw new Error("Dangerous pattern detected in input: ".concat(obj.substring(0, 50), "..."));
        }
        return escapeInput(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(function (item) { return sanitizeObject(item, depth + 1); });
    }
    if (typeof obj === 'object' && obj !== null) {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // キー名もチェック
            if (containsDangerousPattern(key)) {
                throw new Error("Dangerous pattern detected in key: ".concat(key));
            }
            sanitized[key] = sanitizeObject(value, depth + 1);
        }
        return sanitized;
    }
    return obj;
}
/**
 * コマンドインジェクション保護ミドルウェア
 */
var protectFromCommandInjection = function (req, res, next) {
    try {
        // リクエストサイズ制限
        var requestSize = req.body ? JSON.stringify(req.body).length : 0;
        if (requestSize > 1024 * 1024) { // 1MB制限
            res.status(413).json({ error: 'Request entity too large' });
            return;
        }
        // Body, Query, Params を安全化
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        // ヘッダーの基本チェック（curl等のテストツールとブラウザは許可）
        var userAgent = req.get('User-Agent') || '';
        var isCurl = userAgent.toLowerCase().includes('curl');
        var isPostman = userAgent.toLowerCase().includes('postman');
        var isBrowser = userAgent.toLowerCase().includes('mozilla') ||
            userAgent.toLowerCase().includes('chrome') ||
            userAgent.toLowerCase().includes('safari') ||
            userAgent.toLowerCase().includes('firefox') ||
            userAgent.toLowerCase().includes('edge');
        if (!isCurl && !isPostman && !isBrowser && containsDangerousPattern(userAgent)) {
            console.warn("Suspicious User-Agent detected: ".concat(userAgent));
            res.status(400).json({ error: 'Invalid request headers' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Command injection protection error:', error);
        if (error instanceof Error && error.message.includes('Dangerous pattern detected')) {
            res.status(400).json({
                error: 'Invalid input detected',
                message: 'Your input contains potentially dangerous patterns'
            });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.protectFromCommandInjection = protectFromCommandInjection;
/**
 * 特定のフィールドタイプに基づく検証ミドルウェア
 */
var validateFieldTypes = function (fieldTypeMap) {
    return function (req, res, next) {
        try {
            var data = __assign(__assign(__assign({}, req.body), req.query), req.params);
            for (var _i = 0, _a = Object.entries(fieldTypeMap); _i < _a.length; _i++) {
                var _b = _a[_i], fieldName = _b[0], expectedType = _b[1];
                var value = data[fieldName];
                if (value !== undefined && value !== null && value !== '') {
                    var strValue = String(value);
                    if (!matchesSafePattern(strValue, expectedType)) {
                        res.status(400).json({
                            error: 'Field validation failed',
                            field: fieldName,
                            expectedType: expectedType,
                            message: "Field \"".concat(fieldName, "\" does not match expected pattern for type \"").concat(expectedType, "\"")
                        });
                        return;
                    }
                }
            }
            next();
        }
        catch (error) {
            console.error('Field type validation error:', error);
            res.status(500).json({ error: 'Internal server error during validation' });
        }
    };
};
exports.validateFieldTypes = validateFieldTypes;
/**
 * 構造化されたコマンド実行防止
 * アプリケーション内でシステムコマンドが実行されることを防ぐ
 */
var preventSystemCommands = function (req, res, next) {
    // リクエスト内容を文字列化してチェック
    var requestContent = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
    });
    // システムコマンドパターンをチェック
    var systemCommandPattern = /(exec|system|eval|spawn|fork|child_process|require\(['"]child_process['"]\))/i;
    if (systemCommandPattern.test(requestContent)) {
        console.error("System command injection attempt detected from IP: ".concat(req.ip));
        res.status(403).json({
            error: 'Forbidden',
            message: 'System command execution is not allowed'
        });
        return;
    }
    next();
};
exports.preventSystemCommands = preventSystemCommands;
/**
 * ファイルアップロード用の特別な検証
 */
var validateFileUpload = function (req, res, next) {
    try {
        if (req.file || req.files) {
            var files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                if (!file)
                    continue;
                // ファイル名の検証
                if (!matchesSafePattern(file.originalname, 'filename')) {
                    res.status(400).json({
                        error: 'Invalid filename',
                        filename: file.originalname,
                        message: 'Filename contains invalid characters'
                    });
                    return;
                }
                // MIME type検証
                var allowedMimes = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'video/mp4', 'video/mpeg', 'video/quicktime'
                ];
                if (!allowedMimes.includes(file.mimetype)) {
                    res.status(400).json({
                        error: 'Invalid file type',
                        mimetype: file.mimetype,
                        allowed: allowedMimes
                    });
                    return;
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('File upload validation error:', error);
        res.status(500).json({ error: 'Internal server error during file validation' });
    }
};
exports.validateFileUpload = validateFileUpload;
