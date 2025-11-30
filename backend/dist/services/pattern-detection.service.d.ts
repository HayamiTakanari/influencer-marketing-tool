import { RequestLogData } from '../middleware/request-logger';
/**
 * パターンベース攻撃検知サービス
 * 正規表現、機械学習、行動分析を組み合わせた高度な攻撃検知
 */
export declare enum AttackType {
    SQL_INJECTION = "sql_injection",
    XSS_ATTACK = "xss_attack",
    COMMAND_INJECTION = "command_injection",
    PATH_TRAVERSAL = "path_traversal",
    XXE_ATTACK = "xxe_attack",
    LDAP_INJECTION = "ldap_injection",
    NOSQL_INJECTION = "nosql_injection",
    TEMPLATE_INJECTION = "template_injection",
    DESERIALIZATION_ATTACK = "deserialization_attack",
    FILE_INCLUSION = "file_inclusion",
    SSRF_ATTACK = "ssrf_attack",
    CSRF_ATTACK = "csrf_attack",
    CLICKJACKING = "clickjacking",
    HTTP_POLLUTION = "http_pollution",
    PROTOCOL_CONFUSION = "protocol_confusion",
    BUFFER_OVERFLOW = "buffer_overflow",
    FORMAT_STRING = "format_string",
    RACE_CONDITION = "race_condition",
    TIME_BASED_ATTACK = "time_based_attack",
    BLIND_ATTACK = "blind_attack"
}
export interface PatternRule {
    id: string;
    name: string;
    description: string;
    attackType: AttackType;
    patterns: {
        regex: RegExp;
        weight: number;
        context: 'url' | 'query' | 'body' | 'headers' | 'all';
        caseSensitive: boolean;
    }[];
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    falsePositiveRate: number;
    lastUpdated: Date;
}
export interface BehaviorPattern {
    id: string;
    name: string;
    description: string;
    indicators: {
        rapidRequests: boolean;
        errorRateIncrease: boolean;
        unusualUserAgent: boolean;
        geographicalAnomaly: boolean;
        timeBasedAnomaly: boolean;
        sequentialPatterns: boolean;
        headerAnomalies: boolean;
        payloadSizeAnomalies: boolean;
    };
    timeWindow: number;
    threshold: number;
    confidence: number;
}
export interface DetectionResult {
    detected: boolean;
    attackType: AttackType;
    confidence: number;
    riskScore: number;
    matchedPatterns: Array<{
        ruleId: string;
        pattern: string;
        match: string;
        weight: number;
        context: string;
    }>;
    behaviorIndicators: Array<{
        indicator: string;
        value: number;
        threshold: number;
        severity: string;
    }>;
    recommendations: string[];
    evidence: {
        payload: string;
        location: string;
        timestamp: Date;
        metadata: Record<string, any>;
    };
}
export interface MLFeatures {
    payloadLength: number;
    specialCharRatio: number;
    digitRatio: number;
    upperCaseRatio: number;
    tagCount: number;
    attributeCount: number;
    nestedLevel: number;
    encodingCount: number;
    sqlKeywordCount: number;
    jsKeywordCount: number;
    urlCount: number;
    emailCount: number;
    entropy: number;
    compressibility: number;
    requestFrequency: number;
    timeOfDay: number;
    dayOfWeek: number;
    endpointType: string;
    httpMethod: string;
    responseCode: number;
    responseTime: number;
}
declare class PatternDetectionService {
    private patternRules;
    private behaviorPatterns;
    private mlModel;
    private requestHistory;
    constructor();
    /**
     * メインの攻撃検知メソッド
     */
    detectAttacks(logData: RequestLogData): Promise<DetectionResult[]>;
    /**
     * パターンベース検知
     */
    private runPatternDetection;
    /**
     * 個別パターンルールのチェック
     */
    private checkPatternRule;
    /**
     * 行動ベース検知
     */
    private runBehaviorDetection;
    /**
     * 機械学習ベース検知
     */
    private runMLDetection;
    /**
     * 時系列異常検知
     */
    private runTimeSeriesDetection;
    /**
     * アンサンブル検知
     */
    private runEnsembleDetection;
    /**
     * パターンルールの初期化
     */
    private initializePatternRules;
    /**
     * 行動パターンの初期化
     */
    private initializeBehaviorPatterns;
    /**
     * 機械学習モデルの初期化
     */
    private initializeMLModel;
    /**
     * ユーティリティメソッド
     */
    private prepareSearchTargets;
    private getTargetData;
    private calculateRiskScore;
    private generateRecommendations;
    private analyzeBehaviorIndicators;
    private extractMLFeatures;
    private detectTimeSeriesAnomalies;
    private calculateRequestFrequency;
    private calculateErrorRate;
    private isUnusualUserAgent;
    private calculateNestedLevel;
    private countSQLKeywords;
    private countJSKeywords;
    private calculateEntropy;
    private calculateCompressibility;
    private categorizeEndpoint;
    private startPeriodicTasks;
    private cleanupRequestHistory;
    private updatePatternRules;
    /**
     * 公開メソッド
     */
    getPatternRules(): PatternRule[];
    updatePatternRule(ruleId: string, updates: Partial<PatternRule>): boolean;
    addPatternRule(rule: PatternRule): void;
    removePatternRule(ruleId: string): boolean;
    getBehaviorPatterns(): BehaviorPattern[];
    getDetectionStats(): any;
}
export declare const patternDetectionService: PatternDetectionService;
export default PatternDetectionService;
//# sourceMappingURL=pattern-detection.service.d.ts.map