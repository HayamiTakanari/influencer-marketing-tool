import { Request, Response, NextFunction } from 'express';
import { XSSRiskLevel, ValidationContext } from '../utils/xss-detection-engine';
/**
 * 高度な入力バリデーションミドルウェア
 * XSS検出エンジンと組み合わせた包括的な入力検証
 */
interface ValidationConfig {
    fieldName: string;
    context: ValidationContext;
    required?: boolean;
    customValidator?: (value: string) => Promise<boolean>;
}
interface XSSValidationOptions {
    blockOnDetection?: boolean;
    logOnly?: boolean;
    allowedRiskLevel?: XSSRiskLevel;
    customSanitizer?: (input: string) => string;
}
/**
 * 包括的なXSS検証ミドルウェア
 */
export declare const validateXSSInput: (fieldsConfig: {
    [fieldName: string]: ValidationConfig;
}, options?: XSSValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * DOMPurifyを使用した高度なサニタイゼーション
 */
declare function sanitizeWithDOMPurify(input: string, context: ValidationContext): string;
/**
 * sanitize-htmlを使用したリッチテキストサニタイゼーション
 */
export declare function sanitizeRichContent(input: string, context: ValidationContext): string;
/**
 * 特定フィールドのXSS検証（単発用）
 */
export declare const validateSingleField: (fieldName: string, context: ValidationContext, options?: XSSValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 一般的なフィールドタイプ用のプリセット
 */
export declare const ValidationPresets: {
    plainText: (maxLength?: number) => ValidationContext;
    richText: (maxLength?: number) => ValidationContext;
    username: () => ValidationContext;
    email: () => ValidationContext;
    url: () => ValidationContext;
    comment: (maxLength?: number) => ValidationContext;
    bio: (maxLength?: number) => ValidationContext;
};
declare const _default: {
    validateXSSInput: (fieldsConfig: {
        [fieldName: string]: ValidationConfig;
    }, options?: XSSValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateSingleField: (fieldName: string, context: ValidationContext, options?: XSSValidationOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    sanitizeWithDOMPurify: typeof sanitizeWithDOMPurify;
    sanitizeRichContent: typeof sanitizeRichContent;
    ValidationPresets: {
        plainText: (maxLength?: number) => ValidationContext;
        richText: (maxLength?: number) => ValidationContext;
        username: () => ValidationContext;
        email: () => ValidationContext;
        url: () => ValidationContext;
        comment: (maxLength?: number) => ValidationContext;
        bio: (maxLength?: number) => ValidationContext;
    };
};
export default _default;
//# sourceMappingURL=advanced-validation.d.ts.map