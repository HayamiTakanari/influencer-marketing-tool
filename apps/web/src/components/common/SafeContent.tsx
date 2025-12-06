import React from 'react';
import { sanitizeHtmlForDisplay, displaySafeText, createSafeHTML, detectXSSAttempt } from '../../utils/xss-protection';

/**
 * XSS攻撃を防ぐ安全なコンテンツ表示コンポーネント
 */

interface SafeTextProps {
  content: string;
  maxLength?: number;
  className?: string;
  title?: string;
}

/**
 * 安全なテキスト表示コンポーネント
 * HTMLタグを除去してエスケープ処理を行う
 */
export const SafeText: React.FC<SafeTextProps> = ({ 
  content, 
  maxLength = 1000, 
  className = '',
  title 
}) => {
  // XSS攻撃の検出
  if (detectXSSAttempt(content)) {
    console.warn('XSS attempt detected in SafeText component');
    return <span className={className}>⚠️ Invalid content</span>;
  }

  // 長さ制限
  let processedContent = content;
  if (content.length > maxLength) {
    processedContent = content.substring(0, maxLength) + '...';
  }

  // 安全なテキスト処理
  const safeContent = displaySafeText(processedContent);

  return (
    <span 
      className={className}
      title={title}
    >
      {safeContent}
    </span>
  );
};

interface SafeHtmlProps {
  content: string;
  allowBasicFormatting?: boolean;
  maxLength?: number;
  className?: string;
}

/**
 * 安全なHTML表示コンポーネント
 * DOMPurifyでサニタイズしたHTMLを表示
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
  content, 
  allowBasicFormatting = false,
  maxLength = 2000,
  className = ''
}) => {
  // XSS攻撃の検出
  if (detectXSSAttempt(content)) {
    console.warn('XSS attempt detected in SafeHtml component');
    return <div className={className}>⚠️ Content blocked for security</div>;
  }

  // 長さ制限
  let processedContent = content;
  if (content.length > maxLength) {
    processedContent = content.substring(0, maxLength) + '...';
  }

  // 安全なHTML処理
  const safeHtml = createSafeHTML(processedContent, allowBasicFormatting);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={safeHtml}
    />
  );
};

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

/**
 * 安全なリンクコンポーネント
 * URLを検証してから表示
 */
export const SafeLink: React.FC<SafeLinkProps> = ({ 
  href, 
  children, 
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer'
}) => {
  // URL検証
  let safeHref = '';
  try {
    const url = new URL(href);
    // 許可されたプロトコルのみ
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
      safeHref = url.toString();
    }
  } catch {
    // 無効なURLの場合は無効化
    console.warn('Invalid URL provided to SafeLink:', href);
  }

  // 安全なURLがない場合はテキストとして表示
  if (!safeHref) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a 
      href={safeHref}
      className={className}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
};

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * 安全な画像表示コンポーネント
 * 画像URLを検証してから表示
 */
export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className = '',
  width,
  height
}) => {
  // URL検証
  let safeSrc = '';
  try {
    if (src.startsWith('data:image/')) {
      // Data URLの場合は基本的なチェック
      if (src.includes('<script') || src.includes('javascript:')) {
        throw new Error('Invalid data URL');
      }
      safeSrc = src;
    } else {
      const url = new URL(src);
      if (['http:', 'https:'].includes(url.protocol)) {
        safeSrc = url.toString();
      }
    }
  } catch {
    console.warn('Invalid image URL provided to SafeImage:', src);
  }

  // 安全なURLがない場合はプレースホルダー
  if (!safeSrc) {
    return (
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ width, height }}
      >
        <span className="text-gray-500">画像を読み込めません</span>
      </div>
    );
  }

  // altテキストもサニタイズ
  const safeAlt = displaySafeText(alt);

  return (
    <img 
      src={safeSrc}
      alt={safeAlt}
      className={className}
      width={width}
      height={height}
      onError={(e) => {
        // 画像読み込み失敗時のフォールバック
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        
        // エラーを親要素に表示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-gray-200 flex items-center justify-center p-4';
        errorDiv.textContent = '画像を読み込めません';
        target.parentNode?.insertBefore(errorDiv, target);
      }}
    />
  );
};

interface UserContentProps {
  content: string;
  type: 'text' | 'rich' | 'markdown';
  maxLength?: number;
  className?: string;
}

/**
 * ユーザー生成コンテンツの安全な表示コンポーネント
 */
export const UserContent: React.FC<UserContentProps> = ({ 
  content, 
  type = 'text',
  maxLength = 1000,
  className = ''
}) => {
  // XSS攻撃の検出
  if (detectXSSAttempt(content)) {
    console.warn('XSS attempt detected in UserContent component');
    return <div className={className}>⚠️ Content blocked for security</div>;
  }

  switch (type) {
    case 'rich':
      return (
        <SafeHtml 
          content={content}
          allowBasicFormatting={true}
          maxLength={maxLength}
          className={className}
        />
      );
    
    case 'markdown':
      // Markdownは将来的にMarkdownパーサーと組み合わせる
      return (
        <SafeText 
          content={content}
          maxLength={maxLength}
          className={className}
        />
      );
    
    default:
      return (
        <SafeText 
          content={content}
          maxLength={maxLength}
          className={className}
        />
      );
  }
};

export default {
  SafeText,
  SafeHtml,
  SafeLink,
  SafeImage,
  UserContent
};