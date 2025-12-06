import { z } from 'zod';
import { UserRole } from '@prisma/client';

// セキュリティ強化されたバリデーションスキーマ
const isProduction = process.env.NODE_ENV === 'production';

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .refine((email) => {
      if (!isProduction) return true;
      // 危険な文字列パターンをチェック（本番環境のみ）
      const dangerousPatterns = [/'|"|\\|;|--|\/\*|\*\//];
      return !dangerousPatterns.some(pattern => 
        typeof pattern === 'string' ? email.includes(pattern) : pattern.test(email)
      );
    }, 'Email contains invalid characters'),
  
  password: z.string()
    .min(isProduction ? 8 : 4, isProduction ? 'Password must be at least 8 characters' : 'Password must be at least 4 characters')
    .max(128, 'Password too long')
    .refine((password) => {
      if (!isProduction) return true;
      // パスワード強度チェック（本番環境のみ）
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      return hasUpperCase && hasLowerCase && hasNumbers;
    }, 'Password must contain uppercase, lowercase, and number'),
  
  role: z.nativeEnum(UserRole),
  
  companyName: z.string()
    .max(200, 'Company name too long')
    .refine((name) => {
      if (!name) return true;
      // HTMLタグや危険な文字列をチェック
      return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Company name contains invalid characters')
    .optional(),
  
  contactName: z.string()
    .max(100, 'Contact name too long')
    .refine((name) => {
      if (!name) return true;
      return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Contact name contains invalid characters')
    .optional(),
  
  displayName: z.string()
    .max(50, 'Display name too long')
    .refine((name) => {
      if (!name) return true;
      return !/<[^>]*>/.test(name) && !/['"\\;]/.test(name);
    }, 'Display name contains invalid characters')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
});

// クエリパラメータ用のスキーマ
export const userQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().max(100, 'Search term too long').optional(),
});

// ID パラメータ用のスキーマ
export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;