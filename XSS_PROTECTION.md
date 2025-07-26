# XSS（Cross-Site Scripting）対策実装ドキュメント

## 概要
インフルエンサーマーケティングツールに実装された包括的なXSS対策について説明します。

## 実装済みXSS対策

### 1. 出力時のエスケープ処理 ✅

#### バックエンド（Node.js/Express）
```typescript
// /backend/src/utils/xss-protection.ts

// 基本HTMLエスケープ
export function escapeHtml(text: string): string {
  const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return text.replace(/[&<>"'`=\/]/g, (match) => HTML_ESCAPE_MAP[match]);
}
```

#### フロントエンド（React/Next.js）
```typescript
// /frontend/src/utils/xss-protection.ts

// React用安全なHTML生成
export function createSafeHTML(html: string, allowBasicFormatting = false): { __html: string } {
  const sanitized = sanitizeHtmlForDisplay(html, allowBasicFormatting);
  return { __html: sanitized };
}

// 安全なコンポーネント
<SafeText content={userInput} className="text-gray-800" />
<SafeHtml content={richText} allowBasicFormatting={true} />
```

### 2. フレームワーク・ライブラリ活用 ✅

#### DOMPurify
- **バックエンド**: JSDOMと組み合わせてサーバーサイドサニタイゼーション
- **フロントエンド**: ブラウザ環境での強力なHTMLサニタイゼーション

```typescript
// DOMPurifyを使用した安全化
export function sanitizeHtmlContent(dirty: string): string {
  const config = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: false,
    REMOVE_SCRIPT_TAG: true,
    SANITIZE_DOM: true
  };
  return purify.sanitize(dirty, config);
}
```

#### sanitize-html
- より細かい制御が可能なHTMLサニタイゼーション
- リッチテキスト用の制限的な許可タグ設定

```typescript
// リッチテキスト用サニタイゼーション
const options = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
  allowedAttributes: {
    'a': ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto']
};
```

#### xss-filters
- コンテキスト別のエスケープ処理
- JavaScript、CSS、URL等の特殊なコンテキスト対応

### 3. 危険な出力方法の排除 ✅

#### 危険なDOM操作の代替
```typescript
// ❌ 危険: innerHTML
element.innerHTML = userInput;

// ✅ 安全: textContent
element.textContent = userInput;

// ✅ 安全: サニタイズ済みHTML
element.innerHTML = sanitizeHtmlForDisplay(userInput);
```

#### React安全コンポーネント
```typescript
// /frontend/src/components/common/SafeContent.tsx

// 安全なDOM操作関数群
export const safeDOMOperations = {
  setInnerHTML: (element: HTMLElement, html: string) => {
    const sanitized = sanitizeHtmlForDisplay(html, true);
    element.innerHTML = sanitized;
  },
  setInnerText: (element: HTMLElement, text: string) => {
    element.textContent = displaySafeText(text);
  }
};
```

### 4. CSP（Content Security Policy）強化 ✅

#### Next.js設定（next.config.js）
```javascript
headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.cloudinary.com wss: ws:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  }
]
```

#### バックエンドHelmet設定
```typescript
// /backend/src/middleware/security.ts
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
});
```

### 5. XSS対策ユーティリティの導入 ✅

#### 包括的なサニタイゼーション関数
```typescript
// コンテキスト別サニタイゼーション
export const sanitizeByContext = {
  htmlText: sanitizeTextContent,
  htmlAttribute: (value: string) => escapeHtml(sanitizeTextContent(value)),
  jsString: (value: string) => sanitizeTextContent(value).replace(/\\/g, '\\\\'),
  cssValue: (value: string) => sanitizeTextContent(value).replace(/expression\(/gi, ''),
  url: sanitizeUrl,
  fileName: sanitizeFileName,
  richText: sanitizeRichText
};
```

## 高度なXSS対策機能

### 1. リアルタイム攻撃検出
```typescript
// XSS攻撃パターンの検出
export function detectXSSAttempt(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /eval\s*\(/gi
  ];
  return xssPatterns.some(pattern => pattern.test(input));
}
```

### 2. CSP違反監視
```typescript
// CSP違反の自動報告
document.addEventListener('securitypolicyviolation', (event) => {
  fetch('/api/security/csp-report', {
    method: 'POST',
    body: JSON.stringify({
      'csp-report': {
        'blocked-uri': event.blockedURI,
        'violated-directive': event.violatedDirective,
        'document-uri': event.documentURI
      }
    })
  });
});
```

### 3. DOM変更監視
```typescript
// 動的スクリプト注入の検出
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
        console.warn('Unauthorized script injection detected');
        reportXSSAttempt('Dynamic script injection', 'DOM manipulation');
      }
    });
  });
});
```

### 4. フォーム入力監視
```typescript
// フォーム入力でのXSS試行検出
export function monitorFormInput(element: HTMLElement): void {
  const inputs = element.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', (event) => {
      const value = (event.target as HTMLInputElement).value;
      if (detectXSSAttempt(value)) {
        reportXSSAttempt(value, 'form input');
      }
    });
  });
}
```

## セキュリティコンポーネント使用例

### 基本的なテキスト表示
```tsx
import { SafeText, SafeHtml, SafeLink, SafeImage } from '../components/common/SafeContent';

// 安全なテキスト表示
<SafeText 
  content={user.bio} 
  maxLength={500}
  className="text-gray-600"
/>

// 安全なHTML表示（制限付き）
<SafeHtml 
  content={post.content}
  allowBasicFormatting={true}
  className="prose"
/>

// 安全なリンク
<SafeLink href={user.website} className="text-blue-500">
  {user.displayName}のウェブサイト
</SafeLink>

// 安全な画像表示
<SafeImage 
  src={user.profileImage}
  alt={`${user.displayName}のプロフィール画像`}
  className="w-16 h-16 rounded-full"
/>
```

### ユーザー生成コンテンツ
```tsx
// プロフィール表示での使用例
<UserContent 
  content={influencer.description}
  type="rich"
  maxLength={1000}
  className="mt-4"
/>

// コメント表示での使用例
<UserContent 
  content={comment.text}
  type="text"
  maxLength={500}
  className="text-gray-700"
/>
```

## セキュリティログと監視

### 1. CSP違反ログ
```
CSP Violation: {
  blockedURI: "data:text/html,<script>alert('xss')</script>",
  violatedDirective: "script-src",
  documentURI: "https://app.example.com/profile"
}
```

### 2. XSS攻撃試行ログ
```
XSS Attempt: {
  input: "<script>alert('xss')</script>",
  location: "/profile - description field",
  timestamp: "2025-01-20T10:30:00Z",
  clientIP: "192.168.1.100"
}
```

## 開発・運用ガイドライン

### 1. コーディング規則
- **常にサニタイゼーション**: ユーザー入力は必ずサニタイズしてから出力
- **コンテキスト別処理**: HTMLテキスト、属性、JavaScript等でそれぞれ適切な処理を使用
- **安全なコンポーネント**: 標準のReactコンポーネントではなく、SafeContentコンポーネントを使用

### 2. テスト方法
```typescript
// XSS攻撃テストパターン
const xssTestCases = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src="x" onerror="alert(\'xss\')" />',
  '<iframe src="javascript:alert(\'xss\')"></iframe>',
  '"><script>alert("xss")</script>'
];
```

### 3. 監視とアラート
- CSP違反の急増
- XSS攻撃試行の検出
- 不正なスクリプト注入の試み

### 4. 定期的なセキュリティチェック
- 依存関係の脆弱性スキャン
- CSPポリシーの見直し
- セキュリティヘッダーの検証

## 今後の改善計画

1. **Trusted Types**の導入（ブラウザサポートが広がり次第）
2. **SRI（Subresource Integrity）**の実装
3. **Web Security Scanner**との統合
4. **自動XSSテスト**の CI/CD組み込み
5. **セキュリティ研修**とガイドライン更新

---

この実装により、一般的なXSS攻撃（Stored XSS、Reflected XSS、DOM-based XSS）に対する包括的な防御が確立されています。