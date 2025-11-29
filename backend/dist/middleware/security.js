"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueryParameters = exports.checkDatabaseQuota = exports.sanitizeInput = exports.checkDatabasePermissions = exports.upload = exports.securityHeaders = exports.uploadRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.createRateLimit = void 0;
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const multer_1 = __importDefault(require("multer"));
// レート制限設定
const createRateLimit = (options) => {
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
        directives: {
            defaultSrc: ["'self'"],
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
            frameAncestors: ["'none'"],
            // アップグレード非セキュア接続
            ...(process.env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
            // レポートURI（CSP違反報告）
            reportUri: ["/api/security/csp-report"]
        },
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
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    // 許可されるファイル形式
    const allowedMimes = [
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
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB制限
        files: 5, // 同時に5ファイルまで
    },
});
// データベース操作権限チェック
const checkDatabasePermissions = (requiredRole = ['ADMIN']) => {
    return (req, res, next) => {
        const user = req.user;
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
const sanitizeInput = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // HTMLタグの除去
            value = value.replace(/<[^>]*>/g, '');
            // SQLインジェクション対策の基本的な文字をエスケープ
            value = value.replace(/['"\\;]/g, '');
            // XSS攻撃対策
            value = value.replace(/[<>&"']/g, (match) => {
                const htmlEntities = {
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
                const sanitized = {};
                for (const key in value) {
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
const checkDatabaseQuota = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // ユーザーロール別の容量制限（バイト）
        const quotaLimits = {
            'CLIENT': 100 * 1024 * 1024, // 100MB
            'INFLUENCER': 500 * 1024 * 1024, // 500MB
            'ADMIN': 2 * 1024 * 1024 * 1024 // 2GB
        };
        const userQuota = quotaLimits[user.role] || quotaLimits.CLIENT;
        // ここで実際のデータベース使用量をチェック
        // 実装は実際のストレージシステムに依存
        const currentUsage = await getCurrentUserStorageUsage(user.id);
        if (currentUsage >= userQuota) {
            res.status(413).json({
                error: 'Storage quota exceeded',
                currentUsage,
                quota: userQuota,
                message: 'Please delete some files or upgrade your plan'
            });
            return;
        }
        // リクエストに容量情報を追加
        req.storageInfo = {
            currentUsage,
            quota: userQuota,
            available: userQuota - currentUsage
        };
        next();
    }
    catch (error) {
        console.error('Quota check error:', error);
        res.status(500).json({ error: 'Internal server error during quota check' });
    }
};
exports.checkDatabaseQuota = checkDatabaseQuota;
// ストレージ使用量取得（実装例）
async function getCurrentUserStorageUsage(userId) {
    // 実際の実装では、ファイルサイズの合計やデータベースレコードサイズを計算
    // ここでは簡易的な実装例
    return 0; // TODO: 実際のストレージ使用量を計算
}
// パラメータ化クエリ強制（Prisma使用時の追加チェック）
const validateQueryParameters = (schema) => {
    return (req, res, next) => {
        try {
            // クエリパラメータの検証
            if (Object.keys(req.query).length > 0) {
                schema.parse(req.query);
            }
            // パラメータの検証
            if (Object.keys(req.params).length > 0) {
                // パラメータは通常文字列なので、基本的な検証を行う
                for (const [key, value] of Object.entries(req.params)) {
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
