import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { detectXSSAttack, XSSRiskLevel, ValidationContext } from '../utils/xss-detection-engine';
import sanitizeHtml from 'sanitize-html';

// DOMPurifyをサーバーサイドで使用するためのセットアップ
const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

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
export const validateXSSInput = (
  fieldsConfig: { [fieldName: string]: ValidationConfig },
  options: XSSValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const validationResults: any = {};
      const detectedAttacks: any[] = [];
      let hasHighRiskAttack = false;

      // リクエストボディの検証
      for (const [fieldName, config] of Object.entries(fieldsConfig)) {
        const fieldValue = getNestedValue(req.body, fieldName);
        
        if (!fieldValue) {
          if (config.required) {
            res.status(400).json({
              error: 'Validation failed',
              field: fieldName,
              message: 'Required field is missing'
            });
            return;
          }
          continue;
        }

        if (typeof fieldValue !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            field: fieldName,
            message: 'Field must be a string'
          });
          return;
        }

        // XSS検出の実行
        const detectionResult = await detectXSSAttack(
          fieldValue,
          config.context,
          userId,
          ipAddress
        );

        validationResults[fieldName] = detectionResult;

        if (detectionResult.isXSS) {
          detectedAttacks.push({
            field: fieldName,
            result: detectionResult,
            value: fieldValue.substring(0, 100) // 長さ制限
          });

          // リスクレベルの判定
          if (detectionResult.riskLevel === XSSRiskLevel.CRITICAL || 
              detectionResult.riskLevel === XSSRiskLevel.HIGH) {
            hasHighRiskAttack = true;
          }

          // カスタムバリデーターの実行
          if (config.customValidator) {
            const customResult = await config.customValidator(fieldValue);
            if (!customResult) {
              res.status(400).json({
                error: 'Custom validation failed',
                field: fieldName
              });
              return;
            }
          }

          // 許可されたリスクレベルの確認
          if (options.allowedRiskLevel && 
              getRiskLevelNumeric(detectionResult.riskLevel) > getRiskLevelNumeric(options.allowedRiskLevel)) {
            res.status(400).json({
              error: 'Input rejected due to security concerns',
              field: fieldName,
              riskLevel: detectionResult.riskLevel,
              message: 'Content contains potentially dangerous patterns'
            });
            return;
          }

          // 入力のサニタイゼーション
          let sanitized = detectionResult.cleanedInput;
          if (options.customSanitizer) {
            sanitized = options.customSanitizer(sanitized);
          } else {
            sanitized = sanitizeWithDOMPurify(sanitized, config.context);
          }

          // サニタイズされた値を設定
          setNestedValue(req.body, fieldName, sanitized);
        }
      }

      // 攻撃検出時の処理
      if (detectedAttacks.length > 0) {
        // 詳細ログの記録
        await logDetailedAttackAttempt({
          userId,
          ipAddress,
          userAgent,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date(),
          attacks: detectedAttacks,
          headers: req.headers,
          hasHighRiskAttack
        });

        // 高リスク攻撃の場合は即座にブロック
        if (hasHighRiskAttack && options.blockOnDetection !== false) {
          res.status(403).json({
            error: 'Security violation detected',
            message: 'Your request contains potentially malicious content',
            incidentId: generateIncidentId()
          });
          return;
        }

        // ログのみモードでない場合は警告を返す
        if (!options.logOnly) {
          res.status(400).json({
            error: 'Input validation failed',
            message: 'Some fields contain content that requires sanitization',
            details: detectedAttacks.map(attack => ({
              field: attack.field,
              riskLevel: attack.result.riskLevel,
              recommendations: attack.result.recommendations
            }))
          });
          return;
        }
      }

      // 検証結果をリクエストに追加
      (req as any).xssValidation = {
        results: validationResults,
        attacks: detectedAttacks,
        hasAttacks: detectedAttacks.length > 0
      };

      next();
    } catch (error) {
      console.error('XSS validation error:', error);
      res.status(500).json({
        error: 'Internal server error during security validation'
      });
    }
  };
};

/**
 * DOMPurifyを使用した高度なサニタイゼーション
 */
function sanitizeWithDOMPurify(input: string, context: ValidationContext): string {
  try {
    let config: any = {
      ALLOWED_TAGS: context.allowedTags || [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      REMOVE_SCRIPT_TAG: true,
      REMOVE_ONERROR_TAG: true,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: false,
      RETURN_DOM: false,
      RETURN_TRUSTED_TYPE: false
    };

    // 許可される属性の設定
    if (context.allowedAttributes) {
      const allowedAttrs: string[] = [];
      for (const attrs of Object.values(context.allowedAttributes)) {
        allowedAttrs.push(...attrs);
      }
      config.ALLOWED_ATTR = allowedAttrs;
    }

    // strict modeの場合はより厳しい設定
    if (context.strictMode) {
      config.ALLOWED_TAGS = [];
      config.KEEP_CONTENT = false;
    }

    return purify.sanitize(input, config);
  } catch (error) {
    console.error('DOMPurify sanitization error:', error);
    // フォールバック：HTMLタグを完全除去
    return input.replace(/<[^>]*>/g, '');
  }
}

/**
 * sanitize-htmlを使用したリッチテキストサニタイゼーション
 */
export function sanitizeRichContent(input: string, context: ValidationContext): string {
  const options = {
    allowedTags: context.allowedTags || ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: context.allowedAttributes || {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    disallowedTagsMode: 'discard',
    allowedClasses: {},
    textFilter: function(text: string) {
      // テキスト部分のエスケープ
      return text.replace(/[<>&"']/g, (match) => {
        const escapeMap: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match];
      });
    },
    exclusiveFilter: function(frame: any) {
      // JavaScript プロトコルの除去
      if (frame.attribs && frame.attribs.href && 
          /^javascript:/i.test(frame.attribs.href)) {
        return false;
      }
      return true;
    }
  };

  try {
    return sanitizeHtml(input, options);
  } catch (error) {
    console.error('sanitize-html error:', error);
    return input.replace(/<[^>]*>/g, '');
  }
}

/**
 * 特定フィールドのXSS検証（単発用）
 */
export const validateSingleField = (
  fieldName: string,
  context: ValidationContext,
  options: XSSValidationOptions = {}
) => {
  return validateXSSInput({ [fieldName]: { fieldName, context } }, options);
};

/**
 * 一般的なフィールドタイプ用のプリセット
 */
export const ValidationPresets = {
  // 通常のテキスト（HTMLなし）
  plainText: (maxLength = 1000): ValidationContext => ({
    allowHtml: false,
    maxLength,
    strictMode: true
  }),

  // リッチテキスト（制限付きHTML）
  richText: (maxLength = 5000): ValidationContext => ({
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote'],
    allowedAttributes: {},
    maxLength,
    strictMode: false
  }),

  // ユーザー名
  username: (): ValidationContext => ({
    allowHtml: false,
    maxLength: 50,
    strictMode: true
  }),

  // メールアドレス
  email: (): ValidationContext => ({
    allowHtml: false,
    maxLength: 255,
    strictMode: true
  }),

  // URL
  url: (): ValidationContext => ({
    allowHtml: false,
    maxLength: 2000,
    strictMode: true
  }),

  // コメント・レビュー
  comment: (maxLength = 2000): ValidationContext => ({
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: {},
    maxLength,
    strictMode: false
  }),

  // プロフィール説明
  bio: (maxLength = 1000): ValidationContext => ({
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u'],
    allowedAttributes: {},
    maxLength,
    strictMode: false
  })
};

/**
 * ユーティリティ関数群
 */

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function getRiskLevelNumeric(level: XSSRiskLevel): number {
  const levels = {
    [XSSRiskLevel.LOW]: 1,
    [XSSRiskLevel.MEDIUM]: 2,
    [XSSRiskLevel.HIGH]: 3,
    [XSSRiskLevel.CRITICAL]: 4
  };
  return levels[level] || 0;
}

async function logDetailedAttackAttempt(details: any): Promise<void> {
  try {
    console.error('Detailed XSS Attack Attempt:', details);
    
    // 実際の実装では、データベースや外部ログサービスに送信
    // await saveToSecurityDatabase(details);
    // await sendToSlackAlert(details);
  } catch (error) {
    console.error('Failed to log attack attempt:', error);
  }
}

function generateIncidentId(): string {
  return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  validateXSSInput,
  validateSingleField,
  sanitizeWithDOMPurify,
  sanitizeRichContent,
  ValidationPresets
};