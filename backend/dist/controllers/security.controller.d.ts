import { Request, Response } from 'express';
/**
 * CSP違反レポートの処理
 */
export declare const handleCSPReport: (req: Request, res: Response) => Promise<void>;
/**
 * XSS攻撃試行の報告処理
 */
export declare const handleXSSAttempt: (req: Request, res: Response) => Promise<void>;
/**
 * セキュリティ統計情報の取得（管理者用）
 */
export declare const getSecurityStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=security.controller.d.ts.map