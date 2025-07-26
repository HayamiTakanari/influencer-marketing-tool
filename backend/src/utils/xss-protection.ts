import DOMPurify from 'dompurify';
import sanitizeHtml from 'sanitize-html';
import { JSDOM } from 'jsdom';
import xss from 'xss-filters';

// DOMPurifyをサーバーサイドで使用するためのJSDOMセットアップ
const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

/**
 * XSS対策のためのエスケープとサニタイゼーション機能
 */

// HTMLエスケープのマッピング
const HTML_ESCAPE_MAP: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * 基本的なHTMLエスケープ処理
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text.replace(/[&<>"'`=\/]/g, (match) => {
    return HTML_ESCAPE_MAP[match];
  });
}

/**
 * HTMLエスケープを元に戻す（必要な場合のみ使用）
 */
export function unescapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  const UNESCAPE_MAP: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&(amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (match) => {
    return UNESCAPE_MAP[match];
  });
}

/**
 * DOMPurifyを使用した強力なHTMLサニタイゼーション
 */
export function sanitizeHtmlContent(dirty: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  stripIgnoreBody?: boolean;
}) {
  if (typeof dirty !== 'string') {
    return '';
  }

  // デフォルト設定：非常に制限的
  const defaultConfig = {
    ALLOWED_TAGS: options?.allowedTags || [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false,
    REMOVE_SCRIPT_TAG: true,
    REMOVE_ONERROR_TAG: true,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  };

  try {
    return purify.sanitize(dirty, defaultConfig);
  } catch (error) {
    console.error('DOMPurify sanitization error:', error);
    // フォールバック：基本的なHTMLエスケープ
    return escapeHtml(dirty);
  }
}

/**
 * テキストコンテンツ用のサニタイゼーション（HTMLタグを完全除去）
 */
export function sanitizeTextContent(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // HTMLタグを完全に除去
  let cleaned = input.replace(/<[^>]*>/g, '');
  
  // 基本的なHTMLエスケープ
  cleaned = escapeHtml(cleaned);
  
  // 制御文字を除去
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // 連続する空白を単一の空白に変換
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * リッチテキスト用のサニタイゼーション（限定的なHTMLタグを許可）
 */
export function sanitizeRichText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const options = {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ],
    allowedAttributes: {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    allowedClasses: {},
    textFilter: function(text: string) {
      return escapeHtml(text);
    }
  };

  try {
    return sanitizeHtml(input, options);
  } catch (error) {
    console.error('sanitize-html error:', error);
    return sanitizeTextContent(input);
  }
}

/**
 * URL用のサニタイゼーション
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // 基本的なURL検証
  const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  
  if (!urlPattern.test(url)) {
    return '';
  }

  // 危険なプロトコルをチェック
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // URLエンコードされた危険な文字をチェック
  const decodedUrl = decodeURIComponent(url);
  if (decodedUrl.includes('<script') || decodedUrl.includes('javascript:')) {
    return '';
  }

  return url;
}

/**
 * JSONデータのサニタイゼーション
 */
export function sanitizeJsonData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeTextContent(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonData(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // キー名もサニタイズ
      const cleanKey = sanitizeTextContent(key);
      sanitized[cleanKey] = sanitizeJsonData(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * ファイル名のサニタイゼーション
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    return '';
  }

  // 基本的なサニタイゼーション
  let cleaned = fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // 危険な文字を除去
    .replace(/^\.+/, '') // 先頭のドットを除去
    .replace(/\.+$/, '') // 末尾のドットを除去
    .trim();

  // 長さ制限
  if (cleaned.length > 255) {
    const ext = cleaned.substring(cleaned.lastIndexOf('.'));
    const name = cleaned.substring(0, cleaned.lastIndexOf('.'));
    cleaned = name.substring(0, 255 - ext.length) + ext;
  }

  // 予約語チェック（Windows）
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  const nameWithoutExt = cleaned.substring(0, cleaned.lastIndexOf('.'));
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    cleaned = `file_${cleaned}`;
  }

  return cleaned || 'untitled';
}

/**
 * CSVデータのサニタイゼーション（CSV Injection対策）
 */
export function sanitizeCsvData(data: string): string {
  if (typeof data !== 'string') {
    return '';
  }

  // CSV injection攻撃を防ぐため、特定の文字で始まる場合は先頭に'を追加
  const dangerousStarts = ['=', '+', '-', '@', '\t', '\r'];
  
  for (const start of dangerousStarts) {
    if (data.startsWith(start)) {
      return `'${data}`;
    }
  }

  // 基本的なサニタイゼーション
  return sanitizeTextContent(data);
}

/**
 * SQL文字列のサニタイゼーション（追加の安全層として）
 */
export function sanitizeSqlString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // SQL注入攻撃に使用される可能性のある文字を除去/エスケープ
  return input
    .replace(/'/g, "''") // シングルクォートをエスケープ
    .replace(/;/g, '') // セミコロンを除去
    .replace(/--/g, '') // SQLコメントを除去
    .replace(/\/\*/g, '') // マルチラインコメントを除去
    .replace(/\*\//g, '')
    .replace(/\bUNION\b/gi, '') // UNION文を除去
    .replace(/\bSELECT\b/gi, '') // SELECT文を除去
    .replace(/\bINSERT\b/gi, '') // INSERT文を除去
    .replace(/\bUPDATE\b/gi, '') // UPDATE文を除去
    .replace(/\bDELETE\b/gi, '') // DELETE文を除去
    .replace(/\bDROP\b/gi, '') // DROP文を除去
    .replace(/\bCREATE\b/gi, '') // CREATE文を除去
    .replace(/\bALTER\b/gi, '') // ALTER文を除去
    .replace(/\bEXEC\b/gi, '') // EXEC文を除去
    .replace(/\bEXECUTE\b/gi, ''); // EXECUTE文を除去
}

/**
 * コンテキスト別サニタイゼーション
 */
export const sanitizeByContext = {
  // HTMLコンテンツ内のテキスト
  htmlText: sanitizeTextContent,
  
  // HTML属性値
  htmlAttribute: (value: string) => {
    return escapeHtml(sanitizeTextContent(value));
  },
  
  // JavaScript文字列
  jsString: (value: string) => {
    const escaped = sanitizeTextContent(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return escaped;
  },
  
  // CSS値
  cssValue: (value: string) => {
    return sanitizeTextContent(value)
      .replace(/[<>"'`]/g, '')
      .replace(/expression\(/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '');
  },
  
  // URL
  url: sanitizeUrl,
  
  // ファイル名
  fileName: sanitizeFileName,
  
  // リッチテキスト
  richText: sanitizeRichText
};

export default {
  escapeHtml,
  unescapeHtml,
  sanitizeHtmlContent,
  sanitizeTextContent,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeJsonData,
  sanitizeFileName,
  sanitizeCsvData,
  sanitizeSqlString,
  sanitizeByContext
};