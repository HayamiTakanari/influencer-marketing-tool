/**
 * リクエスト ID を生成してすべてのレスポンスに含める
 * エラートレースとログの関連付けに使用
 */
import { Request, Response, NextFunction } from 'express';
export interface RequestWithId extends Request {
    requestId: string;
}
export declare const requestIdMiddleware: (req: RequestWithId, res: Response, next: NextFunction) => void;
//# sourceMappingURL=request-id.d.ts.map