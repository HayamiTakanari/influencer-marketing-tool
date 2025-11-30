"use strict";
/**
 * リクエスト ID を生成してすべてのレスポンスに含める
 * エラートレースとログの関連付けに使用
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = require("crypto");
const requestIdMiddleware = (req, res, next) => {
    // リクエストにID がある場合はそれを使用、なければ新規生成
    const requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    req.requestId = requestId;
    // レスポンスヘッダーに Request ID を追加
    res.set('X-Request-ID', requestId);
    // ローカル変数にも設定してテンプレート等で使用可能に
    res.locals.requestId = requestId;
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
//# sourceMappingURL=request-id.js.map