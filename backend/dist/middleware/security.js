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
exports.validateQueryParameters = exports.checkDatabaseQuota = exports.sanitizeInput = exports.checkDatabasePermissions = exports.upload = exports.securityHeaders = exports.uploadRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.createRateLimit = void 0;
var zod_1 = require("zod");
var express_rate_limit_1 = require("express-rate-limit");
var helmet_1 = require("helmet");
var multer_1 = require("multer");
// レート制限設定
var createRateLimit = function (options) {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs,
        max: options.max,
        message: { error: options.message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimit = createRateLimit;
// 一般的なAPI用レート制限（開発環境では緩和）
exports.generalRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15分
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 本番:100回、開発:1000回
    message: 'Too many requests from this IP, please try again later.'
});
// 認証関連のレート制限（開発環境では緩和）
exports.authRateLimit = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15分
    max: process.env.NODE_ENV === 'production' ? 10 : 100, // 本番:10回、開発:100回
    message: 'Too many authentication attempts, please try again later.'
});
// ファイルアップロード用レート制限
exports.uploadRateLimit = (0, exports.createRateLimit)({
    windowMs: 60 * 60 * 1000, // 1時間
    max: 10, // 1時間に10回まで
    message: 'Too many upload attempts, please try again later.'
});
// Helmetセキュリティヘッダー with 強化されたCSP
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: __assign(__assign({ defaultSrc: ["'self'"], 
            // スクリプトソース - XSS対策の核心
            scriptSrc: [
                "'self'",
                "'unsafe-eval'", // React開発時のみ必要（本番では削除推奨）
                // 信頼できるCDNのみ許可
                "https://cdn.jsdelivr.net",
                "https://unpkg.com"
            ], 
            // スタイルソース
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Tailwind CSS等のインラインスタイル用
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net"
            ], 
            // 画像ソース
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https:",
                "https://res.cloudinary.com", // Cloudinary
                "https://images.unsplash.com"
            ], 
            // フォントソース
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net"
            ], 
            // 接続先
            connectSrc: [
                "'self'",
                "https://api.cloudinary.com",
                "wss://localhost:*", // WebSocket (開発時)
                process.env.NODE_ENV === 'production'
                    ? "wss://influencer-marketing-tool.onrender.com"
                    : "ws://localhost:*"
            ], 
            // メディアソース
            mediaSrc: ["'self'", "https:", "data:", "blob:"], 
            // オブジェクトソース（Flash等を無効化）
            objectSrc: ["'none'"], 
            // ベースURI
            baseUri: ["'self'"], 
            // フォーム送信先
            formAction: ["'self'"], 
            // フレーミング対策
            frameAncestors: ["'none'"] }, (process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {})), { 
            // レポートURI（CSP違反報告）
            reportUri: ["/api/security/csp-report"] }),
        reportOnly: false // 本番では false、開発時は true で警告のみ
    },
    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1年
        includeSubDomains: true,
        preload: true
    },
    // Clickjacking対策
    frameguard: {
        action: 'deny'
    },
    // MIME type sniffing対策
    noSniff: true,
    // XSS Protection（ブラウザ内蔵）
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: {
        policy: ["no-referrer", "strict-origin-when-cross-origin"]
    },
    // 権限ポリシー
    // permissionsPolicy: {
    //   features: {
    //     camera: ["'none'"],
    //     microphone: ["'none'"],
    //     geolocation: ["'none'"],
    //     payment: ["'self'"]
    //   }
    // }
});
// ファイルアップロード設定
var storage = multer_1.default.memoryStorage();
var fileFilter = function (req, file, cb) {
    // 許可されるファイル形式
    var allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/mpeg',
        'video/quicktime'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB制限
        files: 5, // 同時に5ファイルまで
    },
});
// データベース操作権限チェック
var checkDatabasePermissions = function (requiredRole) {
    if (requiredRole === void 0) { requiredRole = ['ADMIN']; }
    return function (req, res, next) {
        var user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!requiredRole.includes(user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions for database operations',
                required: requiredRole,
                current: user.role
            });
            return;
        }
        next();
    };
};
exports.checkDatabasePermissions = checkDatabasePermissions;
// 入力サニタイゼーション
var sanitizeInput = function (req, res, next) {
    var sanitizeValue = function (value) {
        if (typeof value === 'string') {
            // HTMLタグの除去
            value = value.replace(/<[^>]*>/g, '');
            // SQLインジェクション対策の基本的な文字をエスケープ
            value = value.replace(/['"\\;]/g, '');
            // XSS攻撃対策
            value = value.replace(/[<>&"']/g, function (match) {
                var htmlEntities = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#x27;'
                };
                return htmlEntities[match];
            });
        }
        else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                return value.map(sanitizeValue);
            }
            else {
                var sanitized = {};
                for (var key in value) {
                    sanitized[key] = sanitizeValue(value[key]);
                }
                return sanitized;
            }
        }
        return value;
    };
    req.body = sanitizeValue(req.body);
    req.query = sanitizeValue(req.query);
    req.params = sanitizeValue(req.params);
    next();
};
exports.sanitizeInput = sanitizeInput;
// データベース容量制限チェック
var checkDatabaseQuota = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, quotaLimits, userQuota, currentUsage, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                user = req.user;
                if (!user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return [2 /*return*/];
                }
                quotaLimits = {
                    'CLIENT': 100 * 1024 * 1024, // 100MB
                    'INFLUENCER': 500 * 1024 * 1024, // 500MB
                    'ADMIN': 2 * 1024 * 1024 * 1024 // 2GB
                };
                userQuota = quotaLimits[user.role] || quotaLimits.CLIENT;
                return [4 /*yield*/, getCurrentUserStorageUsage(user.id)];
            case 1:
                currentUsage = _a.sent();
                if (currentUsage >= userQuota) {
                    res.status(413).json({
                        error: 'Storage quota exceeded',
                        currentUsage: currentUsage,
                        quota: userQuota,
                        message: 'Please delete some files or upgrade your plan'
                    });
                    return [2 /*return*/];
                }
                // リクエストに容量情報を追加
                req.storageInfo = {
                    currentUsage: currentUsage,
                    quota: userQuota,
                    available: userQuota - currentUsage
                };
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Quota check error:', error_1);
                res.status(500).json({ error: 'Internal server error during quota check' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.checkDatabaseQuota = checkDatabaseQuota;
// ストレージ使用量取得（実装例）
function getCurrentUserStorageUsage(userId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // 実際の実装では、ファイルサイズの合計やデータベースレコードサイズを計算
            // ここでは簡易的な実装例
            return [2 /*return*/, 0]; // TODO: 実際のストレージ使用量を計算
        });
    });
}
// パラメータ化クエリ強制（Prisma使用時の追加チェック）
var validateQueryParameters = function (schema) {
    return function (req, res, next) {
        try {
            // クエリパラメータの検証
            if (Object.keys(req.query).length > 0) {
                schema.parse(req.query);
            }
            // パラメータの検証
            if (Object.keys(req.params).length > 0) {
                // パラメータは通常文字列なので、基本的な検証を行う
                for (var _i = 0, _a = Object.entries(req.params); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    if (typeof value === 'string' && /['"\\;]/.test(value)) {
                        res.status(400).json({
                            error: 'Invalid parameter format',
                            parameter: key
                        });
                        return;
                    }
                }
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Invalid query parameters',
                    details: error.issues,
                });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.validateQueryParameters = validateQueryParameters;
