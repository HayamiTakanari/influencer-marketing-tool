"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeByContext = void 0;
exports.escapeHtml = escapeHtml;
exports.unescapeHtml = unescapeHtml;
exports.sanitizeHtmlContent = sanitizeHtmlContent;
exports.sanitizeTextContent = sanitizeTextContent;
exports.sanitizeRichText = sanitizeRichText;
exports.sanitizeUrl = sanitizeUrl;
exports.sanitizeJsonData = sanitizeJsonData;
exports.sanitizeFileName = sanitizeFileName;
exports.sanitizeCsvData = sanitizeCsvData;
exports.sanitizeSqlString = sanitizeSqlString;
var dompurify_1 = require("dompurify");
var sanitize_html_1 = require("sanitize-html");
var jsdom_1 = require("jsdom");
// DOMPurifyをサーバーサイドで使用するためのJSDOMセットアップ
var window = new jsdom_1.JSDOM('').window;
var purify = (0, dompurify_1.default)(window);
/**
 * XSS対策のためのエスケープとサニタイゼーション機能
 */
// HTMLエスケープのマッピング
var HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};
/**
 * 基本的なHTMLエスケープ処理
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/[&<>"'`=\/]/g, function (match) {
        return HTML_ESCAPE_MAP[match];
    });
}
/**
 * HTMLエスケープを元に戻す（必要な場合のみ使用）
 */
function unescapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    var UNESCAPE_MAP = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&#x3D;': '='
    };
    return text.replace(/&(amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, function (match) {
        return UNESCAPE_MAP[match];
    });
}
/**
 * DOMPurifyを使用した強力なHTMLサニタイゼーション
 */
function sanitizeHtmlContent(dirty, options) {
    if (typeof dirty !== 'string') {
        return '';
    }
    // デフォルト設定：非常に制限的
    var defaultConfig = {
        ALLOWED_TAGS: (options === null || options === void 0 ? void 0 : options.allowedTags) || [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: false,
        REMOVE_SCRIPT_TAG: true,
        REMOVE_ONERROR_TAG: true,
        SANITIZE_DOM: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false
    };
    try {
        return purify.sanitize(dirty, defaultConfig);
    }
    catch (error) {
        console.error('DOMPurify sanitization error:', error);
        // フォールバック：基本的なHTMLエスケープ
        return escapeHtml(dirty);
    }
}
/**
 * テキストコンテンツ用のサニタイゼーション（HTMLタグを完全除去）
 */
function sanitizeTextContent(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // HTMLタグを完全に除去
    var cleaned = input.replace(/<[^>]*>/g, '');
    // 基本的なHTMLエスケープ
    cleaned = escapeHtml(cleaned);
    // 制御文字を除去
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // 連続する空白を単一の空白に変換
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}
/**
 * リッチテキスト用のサニタイゼーション（限定的なHTMLタグを許可）
 */
function sanitizeRichText(input) {
    if (typeof input !== 'string') {
        return '';
    }
    var options = {
        allowedTags: [
            'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
        ],
        allowedAttributes: {
            'a': ['href', 'title'],
            'img': ['src', 'alt', 'title', 'width', 'height']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        disallowedTagsMode: 'discard',
        allowedClasses: {},
        textFilter: function (text) {
            return escapeHtml(text);
        }
    };
    try {
        return (0, sanitize_html_1.default)(input, options);
    }
    catch (error) {
        console.error('sanitize-html error:', error);
        return sanitizeTextContent(input);
    }
}
/**
 * URL用のサニタイゼーション
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') {
        return '';
    }
    // 基本的なURL検証
    var urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (!urlPattern.test(url)) {
        return '';
    }
    // 危険なプロトコルをチェック
    var dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    var lowerUrl = url.toLowerCase();
    for (var _i = 0, dangerousProtocols_1 = dangerousProtocols; _i < dangerousProtocols_1.length; _i++) {
        var protocol = dangerousProtocols_1[_i];
        if (lowerUrl.startsWith(protocol)) {
            return '';
        }
    }
    // URLエンコードされた危険な文字をチェック
    var decodedUrl = decodeURIComponent(url);
    if (decodedUrl.includes('<script') || decodedUrl.includes('javascript:')) {
        return '';
    }
    return url;
}
/**
 * JSONデータのサニタイゼーション
 */
function sanitizeJsonData(data) {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data === 'string') {
        return sanitizeTextContent(data);
    }
    if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(function (item) { return sanitizeJsonData(item); });
    }
    if (typeof data === 'object') {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // キー名もサニタイズ
            var cleanKey = sanitizeTextContent(key);
            sanitized[cleanKey] = sanitizeJsonData(value);
        }
        return sanitized;
    }
    return data;
}
/**
 * ファイル名のサニタイゼーション
 */
function sanitizeFileName(fileName) {
    if (typeof fileName !== 'string') {
        return '';
    }
    // 基本的なサニタイゼーション
    var cleaned = fileName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // 危険な文字を除去
        .replace(/^\.+/, '') // 先頭のドットを除去
        .replace(/\.+$/, '') // 末尾のドットを除去
        .trim();
    // 長さ制限
    if (cleaned.length > 255) {
        var ext = cleaned.substring(cleaned.lastIndexOf('.'));
        var name_1 = cleaned.substring(0, cleaned.lastIndexOf('.'));
        cleaned = name_1.substring(0, 255 - ext.length) + ext;
    }
    // 予約語チェック（Windows）
    var reservedNames = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];
    var nameWithoutExt = cleaned.substring(0, cleaned.lastIndexOf('.'));
    if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
        cleaned = "file_".concat(cleaned);
    }
    return cleaned || 'untitled';
}
/**
 * CSVデータのサニタイゼーション（CSV Injection対策）
 */
function sanitizeCsvData(data) {
    if (typeof data !== 'string') {
        return '';
    }
    // CSV injection攻撃を防ぐため、特定の文字で始まる場合は先頭に'を追加
    var dangerousStarts = ['=', '+', '-', '@', '\t', '\r'];
    for (var _i = 0, dangerousStarts_1 = dangerousStarts; _i < dangerousStarts_1.length; _i++) {
        var start = dangerousStarts_1[_i];
        if (data.startsWith(start)) {
            return "'".concat(data);
        }
    }
    // 基本的なサニタイゼーション
    return sanitizeTextContent(data);
}
/**
 * SQL文字列のサニタイゼーション（追加の安全層として）
 */
function sanitizeSqlString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    // SQL注入攻撃に使用される可能性のある文字を除去/エスケープ
    return input
        .replace(/'/g, "''") // シングルクォートをエスケープ
        .replace(/;/g, '') // セミコロンを除去
        .replace(/--/g, '') // SQLコメントを除去
        .replace(/\/\*/g, '') // マルチラインコメントを除去
        .replace(/\*\//g, '')
        .replace(/\bUNION\b/gi, '') // UNION文を除去
        .replace(/\bSELECT\b/gi, '') // SELECT文を除去
        .replace(/\bINSERT\b/gi, '') // INSERT文を除去
        .replace(/\bUPDATE\b/gi, '') // UPDATE文を除去
        .replace(/\bDELETE\b/gi, '') // DELETE文を除去
        .replace(/\bDROP\b/gi, '') // DROP文を除去
        .replace(/\bCREATE\b/gi, '') // CREATE文を除去
        .replace(/\bALTER\b/gi, '') // ALTER文を除去
        .replace(/\bEXEC\b/gi, '') // EXEC文を除去
        .replace(/\bEXECUTE\b/gi, ''); // EXECUTE文を除去
}
/**
 * コンテキスト別サニタイゼーション
 */
exports.sanitizeByContext = {
    // HTMLコンテンツ内のテキスト
    htmlText: sanitizeTextContent,
    // HTML属性値
    htmlAttribute: function (value) {
        return escapeHtml(sanitizeTextContent(value));
    },
    // JavaScript文字列
    jsString: function (value) {
        var escaped = sanitizeTextContent(value)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        return escaped;
    },
    // CSS値
    cssValue: function (value) {
        return sanitizeTextContent(value)
            .replace(/[<>"'`]/g, '')
            .replace(/expression\(/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '');
    },
    // URL
    url: sanitizeUrl,
    // ファイル名
    fileName: sanitizeFileName,
    // リッチテキスト
    richText: sanitizeRichText
};
exports.default = {
    escapeHtml: escapeHtml,
    unescapeHtml: unescapeHtml,
    sanitizeHtmlContent: sanitizeHtmlContent,
    sanitizeTextContent: sanitizeTextContent,
    sanitizeRichText: sanitizeRichText,
    sanitizeUrl: sanitizeUrl,
    sanitizeJsonData: sanitizeJsonData,
    sanitizeFileName: sanitizeFileName,
    sanitizeCsvData: sanitizeCsvData,
    sanitizeSqlString: sanitizeSqlString,
    sanitizeByContext: exports.sanitizeByContext
};
