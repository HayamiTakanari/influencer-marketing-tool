"use strict";
/**
 * 統一的な API レスポンス形式
 * 本番環境での一貫性を保つため、すべてのエンドポイントでこれを使用する
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBadRequest = exports.sendConflict = exports.sendInternalError = exports.sendValidationError = exports.sendNotFound = exports.sendForbidden = exports.sendUnauthorized = exports.sendError = exports.sendSuccess = void 0;
/**
 * 成功レスポンス
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200, requestId) => {
    const response = {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString(),
        requestId
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * エラーレスポンス
 */
const sendError = (res, statusCode, code, message, details, requestId) => {
    const response = {
        success: false,
        statusCode,
        error: {
            code,
            message,
            ...(details && { details })
        },
        timestamp: new Date().toISOString(),
        requestId
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
/**
 * 認証エラー (401)
 */
const sendUnauthorized = (res, message = 'Unauthorized', requestId) => {
    (0, exports.sendError)(res, 401, 'UNAUTHORIZED', message, undefined, requestId);
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * 権限エラー (403)
 */
const sendForbidden = (res, message = 'Forbidden', requestId) => {
    (0, exports.sendError)(res, 403, 'FORBIDDEN', message, undefined, requestId);
};
exports.sendForbidden = sendForbidden;
/**
 * リソース見つからず (404)
 */
const sendNotFound = (res, message = 'Not found', requestId) => {
    (0, exports.sendError)(res, 404, 'NOT_FOUND', message, undefined, requestId);
};
exports.sendNotFound = sendNotFound;
/**
 * バリデーションエラー (400)
 */
const sendValidationError = (res, message, details, requestId) => {
    (0, exports.sendError)(res, 400, 'VALIDATION_ERROR', message, details, requestId);
};
exports.sendValidationError = sendValidationError;
/**
 * サーバーエラー (500)
 */
const sendInternalError = (res, message = 'Internal server error', details, requestId) => {
    (0, exports.sendError)(res, 500, 'INTERNAL_ERROR', message, details, requestId);
};
exports.sendInternalError = sendInternalError;
/**
 * 既に存在する (409)
 */
const sendConflict = (res, message = 'Resource already exists', requestId) => {
    (0, exports.sendError)(res, 409, 'CONFLICT', message, undefined, requestId);
};
exports.sendConflict = sendConflict;
/**
 * 不正なリクエスト (400)
 */
const sendBadRequest = (res, message = 'Bad request', details, requestId) => {
    (0, exports.sendError)(res, 400, 'BAD_REQUEST', message, details, requestId);
};
exports.sendBadRequest = sendBadRequest;
//# sourceMappingURL=api-response.js.map