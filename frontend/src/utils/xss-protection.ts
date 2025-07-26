import DOMPurify from 'dompurify';
import sanitizeHtml from 'sanitize-html';

/**
 * フロントエンド用XSS対策ユーティリティ
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
 * DOMPurifyを使用した安全なHTML出力
 */
export function sanitizeHtmlForDisplay(dirty: string, allowBasicFormatting = false): string {
  if (typeof dirty !== 'string') {
    return '';
  }

  const config = allowBasicFormatting ? {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    REMOVE_SCRIPT_TAG: true,
    SANITIZE_DOM: true
  } : {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false,
    REMOVE_SCRIPT_TAG: true,
    SANITIZE_DOM: true
  };

  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('DOMPurify sanitization error:', error);
    return escapeHtml(dirty);
  }
}

/**
 * テキストコンテンツの安全な表示
 */
export function displaySafeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  // HTMLタグを完全に除去してエスケープ
  return escapeHtml(text.replace(/<[^>]*>/g, ''));
}

/**
 * 安全なDOM要素作成とテキスト設定
 */
export function createSafeElement(tagName: string, textContent: string, className?: string): HTMLElement {
  const element = document.createElement(tagName);
  
  // textContentを使用してXSS攻撃を防ぐ
  element.textContent = textContent;
  
  if (className) {
    // クラス名もサニタイズ
    const safeClassName = className.replace(/[^a-zA-Z0-9\-_]/g, '');
    element.className = safeClassName;
  }
  
  return element;
}

/**
 * 安全なリンク作成
 */
export function createSafeLink(url: string, text: string, target = '_blank'): HTMLAnchorElement {
  const link = document.createElement('a');
  
  // URLの検証とサニタイゼーション
  const safeUrl = sanitizeUrl(url);
  if (safeUrl) {
    link.href = safeUrl;
    link.textContent = text;
    link.target = target;
    link.rel = 'noopener noreferrer'; // セキュリティ強化
  } else {
    link.textContent = text; // 無効なURLの場合はただのテキストとして表示
  }
  
  return link;
}

/**
 * URL検証とサニタイゼーション
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // 基本的なURL検証
  try {
    const urlObj = new URL(url);
    
    // 許可されたプロトコルのみ
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    
    return urlObj.toString();
  } catch {
    return '';
  }
}

/**
 * フォーム入力値のサニタイゼーション
 */
export function sanitizeFormInput(input: string, type: 'text' | 'email' | 'url' | 'tel' = 'text'): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  switch (type) {
    case 'email':
      // メールアドレスの基本的な検証
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(sanitized) ? sanitized : '';
    
    case 'url':
      return sanitizeUrl(sanitized);
    
    case 'tel':
      // 電話番号：数字、ハイフン、括弧、スペース、プラス記号のみ許可
      return sanitized.replace(/[^0-9\-\(\)\s\+]/g, '');
    
    default:
      // テキスト：HTMLタグを除去してエスケープ
      return escapeHtml(sanitized.replace(/<[^>]*>/g, ''));
  }
}

/**
 * 動的コンテンツの安全な挿入
 */
export function insertSafeContent(
  container: HTMLElement, 
  content: string, 
  type: 'text' | 'html' = 'text'
): void {
  if (!container || typeof content !== 'string') {
    return;
  }

  if (type === 'html') {
    // HTMLとして挿入する場合はDOMPurifyでサニタイズ
    const sanitized = sanitizeHtmlForDisplay(content, true);
    container.innerHTML = sanitized;
  } else {
    // テキストとして安全に挿入
    container.textContent = content;
  }
}

/**
 * 危険なDOM操作の代替関数
 */
export const safeDOMOperations = {
  // innerHTML の代替
  setInnerHTML: (element: HTMLElement, html: string) => {
    const sanitized = sanitizeHtmlForDisplay(html, true);
    element.innerHTML = sanitized;
  },

  // innerText の代替
  setInnerText: (element: HTMLElement, text: string) => {
    element.textContent = displaySafeText(text);
  },

  // outerHTML の代替
  setOuterHTML: (element: HTMLElement, html: string) => {
    const sanitized = sanitizeHtmlForDisplay(html, true);
    element.outerHTML = sanitized;
  },

  // insertAdjacentHTML の代替
  insertAdjacentHTML: (
    element: HTMLElement, 
    position: InsertPosition, 
    html: string
  ) => {
    const sanitized = sanitizeHtmlForDisplay(html, true);
    element.insertAdjacentHTML(position, sanitized);
  }
};

/**
 * React/Next.js用のdangerouslySetInnerHTMLの安全な代替
 */
export function createSafeHTML(html: string, allowBasicFormatting = false): { __html: string } {
  const sanitized = sanitizeHtmlForDisplay(html, allowBasicFormatting);
  return { __html: sanitized };
}

/**
 * ユーザー生成コンテンツの表示用コンポーネントヘルパー
 */
export function renderUserContent(
  content: string, 
  maxLength = 1000,
  allowFormatting = false
): string {
  if (typeof content !== 'string') {
    return '';
  }

  // 長さ制限
  let trimmed = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;

  // サニタイゼーション
  return allowFormatting 
    ? sanitizeHtmlForDisplay(trimmed, true)
    : displaySafeText(trimmed);
}

/**
 * CSP違反の報告処理
 */
export function handleCSPViolation(event: SecurityPolicyViolationEvent): void {
  console.warn('CSP Violation:', {
    blockedURI: event.blockedURI,
    documentURI: event.documentURI,
    effectiveDirective: event.effectiveDirective,
    originalPolicy: event.originalPolicy,
    referrer: event.referrer,
    statusCode: event.statusCode,
    violatedDirective: event.violatedDirective
  });

  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // 外部ログサービスへの送信ロジック
    // fetch('/api/security/csp-violation', { ... })
  }
}

/**
 * XSS攻撃の検出と報告
 */
export function detectXSSAttempt(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  const detected = xssPatterns.some(pattern => pattern.test(input));
  
  if (detected) {
    console.warn('Potential XSS attempt detected:', input.substring(0, 100));
    
    // 本番環境では外部ログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      // セキュリティインシデントレポート
      // fetch('/api/security/xss-attempt', { ... })
    }
  }
  
  return detected;
}

export default {
  escapeHtml,
  sanitizeHtmlForDisplay,
  displaySafeText,
  createSafeElement,
  createSafeLink,
  sanitizeUrl,
  sanitizeFormInput,
  insertSafeContent,
  safeDOMOperations,
  createSafeHTML,
  renderUserContent,
  handleCSPViolation,
  detectXSSAttempt
};