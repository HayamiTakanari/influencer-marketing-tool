"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.userQuerySchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// セキュリティ強化されたバリデーションスキーマ
const isProduction = process.env.NODE_ENV === 'production';
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(255, 'Email too long')
        .refine((email) => {
        if (!isProduction)
            return true;
        // 危険な文字列パターンをチェック（本番環境のみ）
        const dangerousPatterns = [/'|"|\\|;|--|\/\*|\*\//];
        return !dangerousPatterns.some(pattern => typeof pattern === 'string' ? email.includes(pattern) : pattern.test(email));
    }, 'Email contains invalid characters'),
    password: zod_1.z.string()
        .min(isProduction ? 8 : 4, isProduction ? 'Password must be at least 8 characters' : 'Password must be at least 4 characters')
        .max(128, 'Password too long')
        .refine((password) => {
        if (!isProduction)
            return true;
        // パスワード強度チェック（本番環境のみ）
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        return hasUpperCase && hasLowerCase && hasNumbers;
    }, 'Password must contain uppercase, lowercase, and number'),
    role: zod_1.z.nativeEnum(client_1.UserRole),
    companyName: zod_1.z.string()
        .max(200, 'Company name too long')
        .refine((name) => {
        if (!name)
            return true;
        // HTMLタグや危険な文字列をチェック
        return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Company name contains invalid characters')
        .optional(),
    contactName: zod_1.z.string()
        .max(100, 'Contact name too long')
        .refine((name) => {
        if (!name)
            return true;
        return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Contact name contains invalid characters')
        .optional(),
    displayName: zod_1.z.string()
        .max(50, 'Display name too long')
        .refine((name) => {
        if (!name)
            return true;
        return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Display name contains invalid characters')
        .optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email('Invalid email address')
        .max(255, 'Email too long'),
    password: zod_1.z.string()
        .min(1, 'Password is required')
        .max(128, 'Password too long'),
});
// クエリパラメータ用のスキーマ
exports.userQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    search: zod_1.z.string().max(100, 'Search term too long').optional(),
});
// ID パラメータ用のスキーマ
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid('Invalid ID format'),
});
//# sourceMappingURL=auth.js.map