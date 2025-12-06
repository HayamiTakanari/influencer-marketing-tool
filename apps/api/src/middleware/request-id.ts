/**
 * リクエスト ID を生成してすべてのレスポンスに含める
 * エラートレースとログの関連付けに使用
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId: string;
}

export const requestIdMiddleware = (
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void => {
  // リクエストにID がある場合はそれを使用、なければ新規生成
  const requestId = req.headers['x-request-id'] as string || randomUUID();

  req.requestId = requestId;

  // レスポンスヘッダーに Request ID を追加
  res.set('X-Request-ID', requestId);

  // ローカル変数にも設定してテンプレート等で使用可能に
  res.locals.requestId = requestId;

  next();
};
