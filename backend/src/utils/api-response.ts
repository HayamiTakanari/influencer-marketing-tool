/**
 * 統一的な API レスポンス形式
 * 本番環境での一貫性を保つため、すべてのエンドポイントでこれを使用する
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * 成功レスポンス
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  requestId?: string
): void => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
    requestId
  };

  res.status(statusCode).json(response);
};

/**
 * エラーレスポンス
 */
export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
  requestId?: string
): void => {
  const response: ApiResponse = {
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

/**
 * 認証エラー (401)
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized',
  requestId?: string
): void => {
  sendError(res, 401, 'UNAUTHORIZED', message, undefined, requestId);
};

/**
 * 権限エラー (403)
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden',
  requestId?: string
): void => {
  sendError(res, 403, 'FORBIDDEN', message, undefined, requestId);
};

/**
 * リソース見つからず (404)
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Not found',
  requestId?: string
): void => {
  sendError(res, 404, 'NOT_FOUND', message, undefined, requestId);
};

/**
 * バリデーションエラー (400)
 */
export const sendValidationError = (
  res: Response,
  message: string,
  details?: any,
  requestId?: string
): void => {
  sendError(res, 400, 'VALIDATION_ERROR', message, details, requestId);
};

/**
 * サーバーエラー (500)
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error',
  details?: any,
  requestId?: string
): void => {
  sendError(res, 500, 'INTERNAL_ERROR', message, details, requestId);
};

/**
 * 既に存在する (409)
 */
export const sendConflict = (
  res: Response,
  message: string = 'Resource already exists',
  requestId?: string
): void => {
  sendError(res, 409, 'CONFLICT', message, undefined, requestId);
};

/**
 * 不正なリクエスト (400)
 */
export const sendBadRequest = (
  res: Response,
  message: string = 'Bad request',
  details?: any,
  requestId?: string
): void => {
  sendError(res, 400, 'BAD_REQUEST', message, details, requestId);
};
