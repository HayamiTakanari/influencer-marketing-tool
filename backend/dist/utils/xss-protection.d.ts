/**
 * 基本的なHTMLエスケープ処理
 */
export declare function escapeHtml(text: string): string;
/**
 * HTMLエスケープを元に戻す（必要な場合のみ使用）
 */
export declare function unescapeHtml(text: string): string;
/**
 * DOMPurifyを使用した強力なHTMLサニタイゼーション
 */
export declare function sanitizeHtmlContent(dirty: string, options?: {
    allowedTags?: string[];
    allowedAttributes?: {
        [key: string]: string[];
    };
    stripIgnoreBody?: boolean;
}): string;
/**
 * テキストコンテンツ用のサニタイゼーション（HTMLタグを完全除去）
 */
export declare function sanitizeTextContent(input: string): string;
/**
 * リッチテキスト用のサニタイゼーション（限定的なHTMLタグを許可）
 */
export declare function sanitizeRichText(input: string): string;
/**
 * URL用のサニタイゼーション
 */
export declare function sanitizeUrl(url: string): string;
/**
 * JSONデータのサニタイゼーション
 */
export declare function sanitizeJsonData(data: any): any;
/**
 * ファイル名のサニタイゼーション
 */
export declare function sanitizeFileName(fileName: string): string;
/**
 * CSVデータのサニタイゼーション（CSV Injection対策）
 */
export declare function sanitizeCsvData(data: string): string;
/**
 * SQL文字列のサニタイゼーション（追加の安全層として）
 */
export declare function sanitizeSqlString(input: string): string;
/**
 * コンテキスト別サニタイゼーション
 */
export declare const sanitizeByContext: {
    htmlText: typeof sanitizeTextContent;
    htmlAttribute: (value: string) => string;
    jsString: (value: string) => string;
    cssValue: (value: string) => string;
    url: typeof sanitizeUrl;
    fileName: typeof sanitizeFileName;
    richText: typeof sanitizeRichText;
};
declare const _default: {
    escapeHtml: typeof escapeHtml;
    unescapeHtml: typeof unescapeHtml;
    sanitizeHtmlContent: typeof sanitizeHtmlContent;
    sanitizeTextContent: typeof sanitizeTextContent;
    sanitizeRichText: typeof sanitizeRichText;
    sanitizeUrl: typeof sanitizeUrl;
    sanitizeJsonData: typeof sanitizeJsonData;
    sanitizeFileName: typeof sanitizeFileName;
    sanitizeCsvData: typeof sanitizeCsvData;
    sanitizeSqlString: typeof sanitizeSqlString;
    sanitizeByContext: {
        htmlText: typeof sanitizeTextContent;
        htmlAttribute: (value: string) => string;
        jsString: (value: string) => string;
        cssValue: (value: string) => string;
        url: typeof sanitizeUrl;
        fileName: typeof sanitizeFileName;
        richText: typeof sanitizeRichText;
    };
};
export default _default;
//# sourceMappingURL=xss-protection.d.ts.map