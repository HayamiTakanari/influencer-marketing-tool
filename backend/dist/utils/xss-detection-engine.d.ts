declare const DANGEROUS_TAGS: string[];
declare const DANGEROUS_ATTRIBUTES: string[];
declare const ALLOWED_TAGS: {
    basic: string[];
    list: string[];
    heading: string[];
    other: string[];
    link: string[];
    image: string[];
};
declare const ALLOWED_ATTRIBUTES: {
    a: string[];
    img: string[];
    div: string[];
    span: string[];
    p: string[];
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
};
declare const XSS_PATTERNS: RegExp[];
/**
 * XSS攻撃レベルの定義
 */
export declare enum XSSRiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
    confidence: number;
    recommendations: string[];
}
/**
 * コンテキスト別の検証設定
 */
export interface ValidationContext {
    allowedTags?: string[];
    allowedAttributes?: {
        [tag: string]: string[];
    };
    maxLength?: number;
    allowHtml?: boolean;
    strictMode?: boolean;
}
/**
 * メインのXSS検出関数
 */
export declare function detectXSSAttack(input: string, context?: ValidationContext, userId?: string, ipAddress?: string): Promise<XSSDetectionResult>;
export { ALLOWED_TAGS, ALLOWED_ATTRIBUTES, DANGEROUS_TAGS, DANGEROUS_ATTRIBUTES, XSS_PATTERNS };
//# sourceMappingURL=xss-detection-engine.d.ts.map