import { Request, Response, NextFunction } from 'express';
declare const SAFE_PATTERNS: {
    text: RegExp;
    email: RegExp;
    url: RegExp;
    filename: RegExp;
    number: RegExp;
    date: RegExp;
    cuid: RegExp;
};
/**
 * コマンドインジェクション保護ミドルウェア
 */
export declare const protectFromCommandInjection: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 特定のフィールドタイプに基づく検証ミドルウェア
 */
export declare const validateFieldTypes: (fieldTypeMap: Record<string, keyof typeof SAFE_PATTERNS>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 構造化されたコマンド実行防止
 * アプリケーション内でシステムコマンドが実行されることを防ぐ
 */
export declare const preventSystemCommands: (req: Request, res: Response, next: NextFunction) => void;
/**
 * ファイルアップロード用の特別な検証
 */
export declare const validateFileUpload: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=command-injection-protection.d.ts.map