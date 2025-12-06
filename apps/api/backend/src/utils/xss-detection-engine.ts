import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 高度なXSS検出エンジン
 * 既知のペイロード、パターンマッチング、ヒューリスティック分析を組み合わせ
 */

// 既知のXSSペイロードデータベース
const KNOWN_XSS_PAYLOADS = [
  // 基本的なスクリプトタグ
  '<script>alert("xss")</script>',
  '<script>alert(\'xss\')</script>',
  '<script>alert(1)</script>',
  '<script>alert(String.fromCharCode(88,83,83))</script>',
  
  // イベントハンドラー
  '<img src="x" onerror="alert(1)">',
  '<img src="x" onerror="alert(\'xss\')">',
  '<body onload="alert(1)">',
  '<input onfocus="alert(1)" autofocus>',
  '<select onfocus="alert(1)" autofocus>',
  '<textarea onfocus="alert(1)" autofocus>',
  '<keygen onfocus="alert(1)" autofocus>',
  '<video><source onerror="alert(1)">',
  '<audio src="x" onerror="alert(1)">',
  
  // JavaScript プロトコル
  'javascript:alert("xss")',
  'javascript:alert(\'xss\')',
  'javascript:alert(1)',
  'javascript:eval("alert(1)")',
  'javascript:void(0);alert(1)',
  
  // VBScript プロトコル
  'vbscript:alert("xss")',
  'vbscript:msgbox("xss")',
  
  // データURI
  'data:text/html,<script>alert(1)</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  
  // SVG XSS
  '<svg onload="alert(1)">',
  '<svg><script>alert(1)</script></svg>',
  '<svg/onload=alert(1)>',
  
  // iframe攻撃
  '<iframe src="javascript:alert(1)"></iframe>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  
  // Object/Embed攻撃
  '<object data="javascript:alert(1)">',
  '<embed src="javascript:alert(1)">',
  
  // Form攻撃
  '<form><button formaction="javascript:alert(1)">',
  '<form><input formaction="javascript:alert(1)" type="submit">',
  
  // CSS攻撃
  '<style>@import "javascript:alert(1)";</style>',
  '<style>body{background:url("javascript:alert(1)")}</style>',
  
  // 属性攻撃
  '<div style="background:url(javascript:alert(1))">',
  '<div style="expression(alert(1))">',
  
  // エンコード攻撃
  '&lt;script&gt;alert(1)&lt;/script&gt;',
  '%3Cscript%3Ealert(1)%3C/script%3E',
  '&#60;script&#62;alert(1)&#60;/script&#62;',
  
  // Filter bypass
  '<scr<script>ipt>alert(1)</scr</script>ipt>',
  '<svg/onload=alert(1)//>',
  '<img src="x"onerror="alert(1)"/>',
  
  // Dom XSS
  'eval("alert(1)")',
  'setTimeout("alert(1)",1)',
  'setInterval("alert(1)",1)',
  'Function("alert(1)")()',
  'window["eval"]("alert(1)")',
  
  // Template literal
  '`${alert(1)}`',
  '${alert(1)}',
  
  // AngularJS
  '{{alert(1)}}',
  '{{constructor.constructor("alert(1)")()}}',
  
  // Vue.js
  '{{this.constructor.constructor("alert(1)")()}}',
  
  // React
  'dangerouslySetInnerHTML={{__html: "<script>alert(1)</script>"}}',
];

// 危険なHTMLタグ（完全ブラックリスト）
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link',
  'style', 'base', 'form', 'input', 'button', 'textarea', 'select',
  'option', 'frame', 'frameset', 'noframes', 'noscript', 'title',
  'head', 'html', 'body', 'xml', 'xss'
];

// 危険な属性（完全ブラックリスト）
const DANGEROUS_ATTRIBUTES = [
  'onabort', 'onactivate', 'onafterprint', 'onafterupdate', 'onbeforeactivate',
  'onbeforecopy', 'onbeforecut', 'onbeforedeactivate', 'onbeforeeditfocus',
  'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onbeforeupdate',
  'onblur', 'onbounce', 'oncellchange', 'onchange', 'onclick', 'oncontextmenu',
  'oncontrolselect', 'oncopy', 'oncut', 'ondataavailable', 'ondatasetchanged',
  'ondatasetcomplete', 'ondblclick', 'ondeactivate', 'ondrag', 'ondragend',
  'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop',
  'onerror', 'onerrorupdate', 'onfilterchange', 'onfinish', 'onfocus',
  'onfocusin', 'onfocusout', 'onhelp', 'onkeydown', 'onkeypress', 'onkeyup',
  'onlayoutcomplete', 'onload', 'onlosecapture', 'onmousedown', 'onmouseenter',
  'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup',
  'onmousewheel', 'onmove', 'onmoveend', 'onmovestart', 'onpaste',
  'onpropertychange', 'onreadystatechange', 'onreset', 'onresize',
  'onresizeend', 'onresizestart', 'onrowenter', 'onrowexit', 'onrowsdelete',
  'onrowsinserted', 'onscroll', 'onselect', 'onselectionchange',
  'onselectstart', 'onstart', 'onstop', 'onsubmit', 'onunload'
];

// 許可されるHTMLタグ（ホワイトリスト）
const ALLOWED_TAGS = {
  // 基本的なテキスト装飾
  basic: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
  
  // リスト
  list: ['ol', 'ul', 'li'],
  
  // 見出し
  heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  
  // その他
  other: ['blockquote', 'pre', 'code', 'span', 'div'],
  
  // リンク（制限付き）
  link: ['a'],
  
  // 画像（制限付き）
  image: ['img']
};

// 許可される属性（ホワイトリスト）
const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  'div': ['class'],
  'span': ['class'],
  'p': ['class'],
  'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class']
};

// XSS攻撃パターン（正規表現）
const XSS_PATTERNS = [
  // スクリプトタグ
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<script[^>]*>/gi,
  
  // イベントハンドラー
  /\s*on\w+\s*=\s*["'][^"']*["']/gi,
  /\s*on\w+\s*=\s*[^"\'\s>]+/gi,
  
  // JavaScript プロトコル
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /livescript\s*:/gi,
  
  // データURI
  /data\s*:\s*text\s*\/\s*html/gi,
  /data\s*:\s*application\s*\/\s*javascript/gi,
  
  // 危険な関数
  /\b(eval|setTimeout|setInterval|Function|execScript)\s*\(/gi,
  
  // DOM操作
  /\b(innerHTML|outerHTML|document\.write|document\.writeln)\s*=/gi,
  
  // CSS expression
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /@import/gi,
  
  // SVG攻撃
  /<svg[^>]*>/gi,
  
  // iframe攻撃
  /<iframe[^>]*>/gi,
  
  // object/embed攻撃
  /<(object|embed|applet)[^>]*>/gi,
  
  // Meta refresh攻撃
  /<meta[^>]*http-equiv[^>]*refresh/gi,
  
  // Base href攻撃
  /<base[^>]*href/gi,
  
  // Form攻撃
  /formaction\s*=\s*["']javascript:/gi,
  
  // 属性内JavaScript
  /style\s*=\s*["'][^"']*javascript\s*:/gi,
  /href\s*=\s*["'][^"']*javascript\s*:/gi,
  /src\s*=\s*["'][^"']*javascript\s*:/gi,
  
  // エンコード攻撃
  /&#x?[0-9a-f]+;?/gi,
  /%[0-9a-f]{2}/gi,
  
  // Template injection
  /\{\{.*\}\}/g,
  /\$\{.*\}/g,
  
  // SQL injection も含む
  /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(\\x23)|(%27)|(%2D%2D)|(%23))/gi
];

/**
 * XSS攻撃レベルの定義
 */
export enum XSSRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 検出結果の詳細情報
 */
export interface XSSDetectionResult {
  isXSS: boolean;
  riskLevel: XSSRiskLevel;
  detectedPatterns: string[];
  matchedPayloads: string[];
  dangerousTags: string[];
  dangerousAttributes: string[];
  cleanedInput: string;
  confidence: number; // 0-100
  recommendations: string[];
}

/**
 * コンテキスト別の検証設定
 */
export interface ValidationContext {
  allowedTags?: string[];
  allowedAttributes?: { [tag: string]: string[] };
  maxLength?: number;
  allowHtml?: boolean;
  strictMode?: boolean;
}

/**
 * メインのXSS検出関数
 */
export async function detectXSSAttack(
  input: string,
  context: ValidationContext = {},
  userId?: string,
  ipAddress?: string
): Promise<XSSDetectionResult> {
  
  const result: XSSDetectionResult = {
    isXSS: false,
    riskLevel: XSSRiskLevel.LOW,
    detectedPatterns: [],
    matchedPayloads: [],
    dangerousTags: [],
    dangerousAttributes: [],
    cleanedInput: input,
    confidence: 0,
    recommendations: []
  };

  if (!input || typeof input !== 'string') {
    return result;
  }

  try {
    // 1. 既知のペイロード検出
    const payloadMatches = detectKnownPayloads(input);
    if (payloadMatches.length > 0) {
      result.isXSS = true;
      result.riskLevel = XSSRiskLevel.CRITICAL;
      result.matchedPayloads = payloadMatches;
      result.confidence = 95;
      result.recommendations.push('既知の攻撃ペイロードが検出されました。入力を完全に拒否してください。');
    }

    // 2. パターンマッチング
    const patternMatches = detectXSSPatterns(input);
    if (patternMatches.length > 0) {
      result.isXSS = true;
      result.detectedPatterns = patternMatches;
      result.riskLevel = result.riskLevel === XSSRiskLevel.CRITICAL 
        ? XSSRiskLevel.CRITICAL 
        : XSSRiskLevel.HIGH;
      result.confidence = Math.max(result.confidence, 80);
      result.recommendations.push('危険なXSSパターンが検出されました。');
    }

    // 3. HTMLタグ・属性検証
    const htmlAnalysis = analyzeHtmlStructure(input, context);
    if (htmlAnalysis.dangerousTags.length > 0 || htmlAnalysis.dangerousAttributes.length > 0) {
      result.isXSS = true;
      result.dangerousTags = htmlAnalysis.dangerousTags;
      result.dangerousAttributes = htmlAnalysis.dangerousAttributes;
      result.riskLevel = result.riskLevel === XSSRiskLevel.CRITICAL 
        ? XSSRiskLevel.CRITICAL 
        : XSSRiskLevel.HIGH;
      result.confidence = Math.max(result.confidence, 70);
      result.recommendations.push('許可されていないHTMLタグまたは属性が検出されました。');
    }

    // 4. ヒューリスティック分析
    const heuristicScore = performHeuristicAnalysis(input);
    if (heuristicScore > 50) {
      result.isXSS = true;
      result.riskLevel = result.riskLevel === XSSRiskLevel.CRITICAL 
        ? XSSRiskLevel.CRITICAL 
        : heuristicScore > 80 ? XSSRiskLevel.HIGH : XSSRiskLevel.MEDIUM;
      result.confidence = Math.max(result.confidence, heuristicScore);
      result.recommendations.push('疑わしいパターンが検出されました。詳細な検証が必要です。');
    }

    // 5. コンテキスト別検証
    const contextValidation = validateContext(input, context);
    if (!contextValidation.isValid) {
      result.isXSS = true;
      result.riskLevel = result.riskLevel === XSSRiskLevel.CRITICAL 
        ? XSSRiskLevel.CRITICAL 
        : XSSRiskLevel.MEDIUM;
      result.recommendations.push(...contextValidation.violations);
    }

    // 6. 入力のクリーニング
    result.cleanedInput = cleanInput(input, context);

    // 7. 攻撃検出時のログ記録
    if (result.isXSS) {
      await logXSSDetection(input, result, userId, ipAddress);
    }

    return result;

  } catch (error) {
    console.error('XSS detection error:', error);
    // エラー時は安全側に倒す
    result.isXSS = true;
    result.riskLevel = XSSRiskLevel.HIGH;
    result.confidence = 0;
    result.recommendations.push('検証中にエラーが発生しました。安全のため入力を拒否します。');
    return result;
  }
}

/**
 * 既知のペイロード検出
 */
function detectKnownPayloads(input: string): string[] {
  const matches: string[] = [];
  const normalizedInput = input.toLowerCase().replace(/\s+/g, '');
  
  for (const payload of KNOWN_XSS_PAYLOADS) {
    const normalizedPayload = payload.toLowerCase().replace(/\s+/g, '');
    if (normalizedInput.includes(normalizedPayload)) {
      matches.push(payload);
    }
  }
  
  return matches;
}

/**
 * XSSパターンマッチング
 */
function detectXSSPatterns(input: string): string[] {
  const matches: string[] = [];
  
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      matches.push(pattern.source);
    }
  }
  
  return matches;
}

/**
 * HTML構造解析
 */
function analyzeHtmlStructure(input: string, context: ValidationContext): {
  dangerousTags: string[];
  dangerousAttributes: string[];
} {
  const dangerousTags: string[] = [];
  const dangerousAttributes: string[] = [];
  
  // タグの検出
  const tagMatches = input.match(/<\/?(\w+)[^>]*>/gi) || [];
  for (const match of tagMatches) {
    const tagName = match.match(/<\/?(\w+)/)?.[1]?.toLowerCase();
    if (tagName && DANGEROUS_TAGS.includes(tagName)) {
      dangerousTags.push(tagName);
    }
    
    // 許可されていないタグのチェック
    if (context.allowedTags && tagName && !context.allowedTags.includes(tagName)) {
      dangerousTags.push(tagName);
    }
  }
  
  // 属性の検出
  const attributeMatches = input.match(/\s+(\w+)\s*=\s*["'][^"']*["']/gi) || [];
  for (const match of attributeMatches) {
    const attrName = match.match(/\s+(\w+)/)?.[1]?.toLowerCase();
    if (attrName && DANGEROUS_ATTRIBUTES.includes(attrName)) {
      dangerousAttributes.push(attrName);
    }
  }
  
  return { dangerousTags, dangerousAttributes };
}

/**
 * ヒューリスティック分析
 */
function performHeuristicAnalysis(input: string): number {
  let score = 0;
  
  // JavaScriptキーワードの検出
  const jsKeywords = ['alert', 'confirm', 'prompt', 'eval', 'setTimeout', 'setInterval'];
  for (const keyword of jsKeywords) {
    if (input.toLowerCase().includes(keyword)) {
      score += 20;
    }
  }
  
  // 特殊文字の密度
  const specialChars = (input.match(/[<>'"();{}]/g) || []).length;
  const density = specialChars / input.length;
  if (density > 0.1) score += 30;
  
  // Base64エンコードの検出
  if (/^[A-Za-z0-9+\/]*={0,2}$/.test(input) && input.length > 20) {
    score += 25;
  }
  
  // URLエンコードの検出
  if (/%[0-9a-f]{2}/gi.test(input)) {
    score += 15;
  }
  
  return Math.min(score, 100);
}

/**
 * コンテキスト別検証
 */
function validateContext(input: string, context: ValidationContext): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // 長さチェック
  if (context.maxLength && input.length > context.maxLength) {
    violations.push(`入力が最大長(${context.maxLength})を超えています`);
  }
  
  // HTML許可チェック
  if (!context.allowHtml && /<[^>]*>/g.test(input)) {
    violations.push('HTMLタグは許可されていません');
  }
  
  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * 入力のクリーニング
 */
function cleanInput(input: string, context: ValidationContext): string {
  let cleaned = input;
  
  if (!context.allowHtml) {
    // HTMLタグを完全除去
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  } else {
    // 許可されたタグのみ保持（DOMPurifyとの組み合わせを推奨）
    // ここでは基本的なクリーニングのみ
    for (const tag of DANGEROUS_TAGS) {
      const regex = new RegExp(`</?${tag}[^>]*>`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }
  }
  
  // 危険な属性を除去
  for (const attr of DANGEROUS_ATTRIBUTES) {
    const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  
  return cleaned;
}

/**
 * XSS検出ログの記録
 */
async function logXSSDetection(
  input: string, 
  result: XSSDetectionResult, 
  userId?: string, 
  ipAddress?: string
): Promise<void> {
  try {
    console.error('XSS Attack Detected:', {
      timestamp: new Date().toISOString(),
      userId,
      ipAddress,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      inputLength: input.length,
      inputSample: input.substring(0, 200),
      detectedPatterns: result.detectedPatterns.slice(0, 5),
      matchedPayloads: result.matchedPayloads.slice(0, 3),
      dangerousTags: result.dangerousTags,
      dangerousAttributes: result.dangerousAttributes
    });

    // データベースへの記録（実装例）
    // 実際の実装では適切なテーブル構造を作成してください
    /* 
    await prisma.securityLog.create({
      data: {
        type: 'XSS_DETECTION',
        severity: result.riskLevel,
        userId,
        ipAddress,
        input: input.substring(0, 1000), // 長さ制限
        detectionDetails: JSON.stringify(result),
        confidence: result.confidence,
        createdAt: new Date()
      }
    });
    */

  } catch (error) {
    console.error('Failed to log XSS detection:', error);
  }
}

export {
  ALLOWED_TAGS,
  ALLOWED_ATTRIBUTES,
  DANGEROUS_TAGS,
  DANGEROUS_ATTRIBUTES,
  XSS_PATTERNS
};