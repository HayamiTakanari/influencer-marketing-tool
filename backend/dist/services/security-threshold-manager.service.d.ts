export interface SecurityThreshold {
    id: string;
    name: string;
    category: 'RATE_LIMIT' | 'ANOMALY_DETECTION' | 'PATTERN_MATCHING' | 'RISK_SCORING' | 'BLACKLIST';
    value: number;
    unit: string;
    description: string;
    lastModified: Date;
    modifiedBy: string;
    isActive: boolean;
    metadata?: Record<string, any>;
}
export interface ThresholdRule {
    id: string;
    name: string;
    condition: string;
    action: 'ADJUST_THRESHOLD' | 'SEND_ALERT' | 'BLOCK_IP' | 'ESCALATE';
    parameters: Record<string, any>;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SecurityConfiguration {
    id: string;
    section: string;
    key: string;
    value: any;
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY';
    description: string;
    validationRule?: string;
    lastModified: Date;
    modifiedBy: string;
    version: number;
}
export interface ThresholdAdjustmentLog {
    id: string;
    thresholdId: string;
    oldValue: number;
    newValue: number;
    reason: string;
    triggeredBy: 'MANUAL' | 'AUTOMATIC' | 'SCHEDULED';
    userId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
declare class SecurityThresholdManagerService {
    private thresholds;
    private configurations;
    private rules;
    constructor();
    /**
     * デフォルト閾値の初期化
     */
    private initializeDefaultThresholds;
    /**
     * 閾値の取得
     */
    getThreshold(id: string): Promise<SecurityThreshold | null>;
    /**
     * カテゴリ別閾値の取得
     */
    getThresholdsByCategory(category: SecurityThreshold['category']): Promise<SecurityThreshold[]>;
    /**
     * 全閾値の取得
     */
    getAllThresholds(): Promise<SecurityThreshold[]>;
    /**
     * 閾値の更新
     */
    updateThreshold(id: string, newValue: number, modifiedBy: string, reason: string): Promise<void>;
    /**
     * 自動閾値調整
     */
    adjustThresholdAutomatically(id: string, adjustment: number, reason: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * 閾値調整の妥当性検証
     */
    private validateThresholdAdjustment;
    /**
     * 動的閾値調整ルールの実行
     */
    evaluateThresholdRules(context: {
        requestCount: number;
        errorRate: number;
        responseTime: number;
        anomalyCount: number;
        timeWindow: number;
    }): Promise<void>;
    /**
     * ルール条件の評価
     */
    private evaluateRuleCondition;
    /**
     * ルールアクションの実行
     */
    private executeRuleAction;
    /**
     * 設定管理
     */
    getConfiguration(section: string, key: string): Promise<SecurityConfiguration | null>;
    updateConfiguration(section: string, key: string, value: any, modifiedBy: string): Promise<void>;
    /**
     * データ型の推論
     */
    private inferDataType;
    /**
     * 閾値調整ログの記録
     */
    private logThresholdAdjustment;
    /**
     * 閾値統計の取得
     */
    getThresholdStatistics(timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        totalAdjustments: number;
        automaticAdjustments: number;
        manualAdjustments: number;
        mostAdjustedThresholds: Array<{
            thresholdId: string;
            adjustmentCount: number;
        }>;
        averageAdjustmentFrequency: number;
    }>;
    /**
     * 閾値最適化の提案
     */
    suggestOptimizations(): Promise<Array<{
        thresholdId: string;
        currentValue: number;
        suggestedValue: number;
        reason: string;
        confidence: number;
    }>>;
    /**
     * 閾値設定のエクスポート
     */
    exportThresholds(): Promise<{
        thresholds: SecurityThreshold[];
        configurations: SecurityConfiguration[];
        exportedAt: Date;
        version: string;
    }>;
    /**
     * 閾値設定のインポート
     */
    importThresholds(data: {
        thresholds: SecurityThreshold[];
        configurations: SecurityConfiguration[];
    }, importedBy: string): Promise<void>;
}
export declare const securityThresholdManagerService: SecurityThresholdManagerService;
export default SecurityThresholdManagerService;
//# sourceMappingURL=security-threshold-manager.service.d.ts.map