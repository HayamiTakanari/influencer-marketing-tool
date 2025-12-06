/**
 * セキュリティ監視とCSP違反報告
 */

// APIエンドポイント
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * CSP違反をサーバーに報告
 */
export function reportCSPViolation(violationEvent: SecurityPolicyViolationEvent): void {
  try {
    const report = {
      'csp-report': {
        'document-uri': violationEvent.documentURI,
        'referrer': violationEvent.referrer,
        'violated-directive': violationEvent.violatedDirective,
        'effective-directive': violationEvent.effectiveDirective,
        'original-policy': violationEvent.originalPolicy,
        'blocked-uri': violationEvent.blockedURI,
        'line-number': violationEvent.lineNumber,
        'column-number': violationEvent.columnNumber,
        'source-file': violationEvent.sourceFile,
        'status-code': violationEvent.statusCode,
        'script-sample': violationEvent.sample || ''
      }
    };

    // 非同期でサーバーに報告（失敗してもアプリケーションに影響しない）
    fetch(`${API_BASE_URL}/security/csp-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    }).catch(error => {
      console.warn('Failed to report CSP violation:', error);
    });

    // コンソールにも警告を出力
    console.warn('CSP Violation:', {
      blockedURI: violationEvent.blockedURI,
      violatedDirective: violationEvent.violatedDirective,
      documentURI: violationEvent.documentURI
    });

  } catch (error) {
    console.error('Error reporting CSP violation:', error);
  }
}

/**
 * XSS攻撃試行をサーバーに報告
 */
export function reportXSSAttempt(input: string, location: string): void {
  try {
    const report = {
      input: input.substring(0, 500), // 長さ制限
      location,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 非同期でサーバーに報告
    fetch(`${API_BASE_URL}/security/xss-attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    }).catch(error => {
      console.warn('Failed to report XSS attempt:', error);
    });

    console.warn('XSS Attempt detected:', { location, input: input.substring(0, 100) });

  } catch (error) {
    console.error('Error reporting XSS attempt:', error);
  }
}

/**
 * セキュリティ監視の初期化
 */
export function initializeSecurityMonitoring(): void {
  // CSP違反の監視
  if (typeof window !== 'undefined') {
    document.addEventListener('securitypolicyviolation', reportCSPViolation);
    
    // 古いブラウザ対応
    window.addEventListener('securitypolicyviolation', reportCSPViolation);
  }
}

/**
 * フォーム入力の監視
 */
export function monitorFormInput(element: HTMLElement): void {
  if (!element) return;

  const inputs = element.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    input.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      const value = target.value;
      
      // XSS攻撃パターンの検出
      const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi,
        /<iframe[\s\S]*?>/gi,
        /eval\s*\(/gi
      ];

      const isXSSAttempt = xssPatterns.some(pattern => pattern.test(value));
      
      if (isXSSAttempt) {
        const location = `${window.location.pathname} - ${target.name || target.id || 'unknown field'}`;
        reportXSSAttempt(value, location);
        
        // ユーザーに警告表示（オプション）
        if (process.env.NODE_ENV === 'development') {
          console.warn('Potentially dangerous input detected');
        }
      }
    });
  });
}

/**
 * DOM操作の監視（MutationObserver使用）
 */
export function monitorDOMChanges(): void {
  if (typeof window === 'undefined' || !window.MutationObserver) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // スクリプトタグの不正な挿入を検出
          if (element.tagName === 'SCRIPT') {
            console.warn('Script tag dynamically added to DOM:', element);
            
            // 外部スクリプトの場合はCSP違反として報告
            const src = element.getAttribute('src');
            if (src && !isAllowedScriptSource(src)) {
              reportXSSAttempt(`Dynamic script: ${src}`, 'DOM manipulation');
            }
          }
          
          // 危険な属性を持つ要素の検出
          const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
          dangerousAttributes.forEach(attr => {
            if (element.hasAttribute(attr)) {
              console.warn(`Element with dangerous attribute ${attr}:`, element);
              reportXSSAttempt(
                `Element with ${attr}: ${element.getAttribute(attr)}`, 
                'DOM manipulation'
              );
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover', 'src', 'href']
  });
}

/**
 * 許可されたスクリプトソースかチェック
 */
function isAllowedScriptSource(src: string): boolean {
  const allowedDomains = [
    'localhost',
    'vercel.live',
    'cdn.jsdelivr.net',
    'unpkg.com'
  ];

  try {
    const url = new URL(src, window.location.href);
    return allowedDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * セキュリティ統計の取得（管理者用）
 */
export async function getSecurityStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/security/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch security stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching security stats:', error);
    throw error;
  }
}

export default {
  initializeSecurityMonitoring,
  reportCSPViolation,
  reportXSSAttempt,
  monitorFormInput,
  monitorDOMChanges,
  getSecurityStats
};