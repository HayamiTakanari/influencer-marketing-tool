import { PrismaClient } from '@prisma/client';

/**
 * セキュリティ閾値・設定管理サービス
 * 動的な閾値調整と設定管理を提供
 */

const prisma = new PrismaClient();

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
  condition: string; // JSON形式の条件式
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

class SecurityThresholdManagerService {
  private thresholds: Map<string, SecurityThreshold> = new Map();
  private configurations: Map<string, SecurityConfiguration> = new Map();
  private rules: Map<string, ThresholdRule> = new Map();

  constructor() {
    this.initializeDefaultThresholds();
  }

  /**
   * デフォルト閾値の初期化
   */
  private initializeDefaultThresholds(): void {
    const defaultThresholds: SecurityThreshold[] = [
      // レート制限関連
      {
        id: 'rate_limit_requests_per_minute',
        name: 'Requests Per Minute Limit',
        category: 'RATE_LIMIT',
        value: 100,
        unit: 'requests/minute',
        description: '1分あたりの最大リクエスト数',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true,
        metadata: { endpoint: 'all', userType: 'anonymous' }
      },
      {
        id: 'rate_limit_requests_per_hour',
        name: 'Requests Per Hour Limit',
        category: 'RATE_LIMIT',
        value: 1000,
        unit: 'requests/hour',
        description: '1時間あたりの最大リクエスト数',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'rate_limit_auth_attempts',
        name: 'Authentication Attempts Limit',
        category: 'RATE_LIMIT',
        value: 5,
        unit: 'attempts/10min',
        description: '認証試行の制限（10分間）',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },

      // 異常検知関連
      {
        id: 'anomaly_response_time_threshold',
        name: 'Response Time Anomaly Threshold',
        category: 'ANOMALY_DETECTION',
        value: 5000,
        unit: 'milliseconds',
        description: 'レスポンス時間の異常閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'anomaly_error_rate_threshold',
        name: 'Error Rate Anomaly Threshold',
        category: 'ANOMALY_DETECTION',
        value: 10,
        unit: 'percentage',
        description: 'エラー率の異常閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'anomaly_request_size_threshold',
        name: 'Request Size Anomaly Threshold',
        category: 'ANOMALY_DETECTION',
        value: 10,
        unit: 'MB',
        description: 'リクエストサイズの異常閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },

      // パターンマッチング関連
      {
        id: 'pattern_confidence_threshold',
        name: 'Pattern Matching Confidence Threshold',
        category: 'PATTERN_MATCHING',
        value: 80,
        unit: 'percentage',
        description: 'パターンマッチングの信頼度閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'pattern_risk_score_threshold',
        name: 'Pattern Risk Score Threshold',
        category: 'PATTERN_MATCHING',
        value: 70,
        unit: 'score',
        description: 'パターンリスクスコアの閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },

      // リスクスコアリング関連
      {
        id: 'risk_score_low_threshold',
        name: 'Low Risk Score Threshold',
        category: 'RISK_SCORING',
        value: 30,
        unit: 'score',
        description: '低リスクの閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'risk_score_medium_threshold',
        name: 'Medium Risk Score Threshold',
        category: 'RISK_SCORING',
        value: 60,
        unit: 'score',
        description: '中リスクの閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },
      {
        id: 'risk_score_high_threshold',
        name: 'High Risk Score Threshold',
        category: 'RISK_SCORING',
        value: 80,
        unit: 'score',
        description: '高リスクの閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      },

      // ブラックリスト関連
      {
        id: 'blacklist_auto_add_threshold',
        name: 'Auto Blacklist Addition Threshold',
        category: 'BLACKLIST',
        value: 10,
        unit: 'violations',
        description: '自動ブラックリスト追加の違反回数閾値',
        lastModified: new Date(),
        modifiedBy: 'system',
        isActive: true
      }
    ];

    defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.id, threshold);
    });
  }

  /**
   * 閾値の取得
   */
  async getThreshold(id: string): Promise<SecurityThreshold | null> {
    return this.thresholds.get(id) || null;
  }

  /**
   * カテゴリ別閾値の取得
   */
  async getThresholdsByCategory(category: SecurityThreshold['category']): Promise<SecurityThreshold[]> {
    return Array.from(this.thresholds.values()).filter(t => t.category === category && t.isActive);
  }

  /**
   * 全閾値の取得
   */
  async getAllThresholds(): Promise<SecurityThreshold[]> {
    return Array.from(this.thresholds.values()).filter(t => t.isActive);
  }

  /**
   * 閾値の更新
   */
  async updateThreshold(
    id: string,
    newValue: number,
    modifiedBy: string,
    reason: string
  ): Promise<void> {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      throw new Error(`Threshold with id ${id} not found`);
    }

    const oldValue = threshold.value;

    // 調整ログの記録
    await this.logThresholdAdjustment({
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      thresholdId: id,
      oldValue,
      newValue,
      reason,
      triggeredBy: 'MANUAL',
      userId: modifiedBy,
      timestamp: new Date()
    });

    // 閾値の更新
    threshold.value = newValue;
    threshold.lastModified = new Date();
    threshold.modifiedBy = modifiedBy;

    this.thresholds.set(id, threshold);

    console.log(`Threshold updated: ${id} changed from ${oldValue} to ${newValue} by ${modifiedBy}`);
  }

  /**
   * 自動閾値調整
   */
  async adjustThresholdAutomatically(
    id: string,
    adjustment: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const threshold = this.thresholds.get(id);
    if (!threshold) {
      throw new Error(`Threshold with id ${id} not found`);
    }

    const oldValue = threshold.value;
    const newValue = Math.max(0, oldValue + adjustment);

    // 調整範囲の検証
    if (!this.validateThresholdAdjustment(id, newValue)) {
      console.warn(`Automatic threshold adjustment rejected for ${id}: value ${newValue} is out of acceptable range`);
      return;
    }

    // 調整ログの記録
    await this.logThresholdAdjustment({
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      thresholdId: id,
      oldValue,
      newValue,
      reason,
      triggeredBy: 'AUTOMATIC',
      timestamp: new Date(),
      metadata
    });

    // 閾値の更新
    threshold.value = newValue;
    threshold.lastModified = new Date();
    threshold.modifiedBy = 'system';

    this.thresholds.set(id, threshold);

    console.log(`Threshold automatically adjusted: ${id} changed from ${oldValue} to ${newValue} (${reason})`);
  }

  /**
   * 閾値調整の妥当性検証
   */
  private validateThresholdAdjustment(id: string, newValue: number): boolean {
    const validationRules: Record<string, { min: number; max: number }> = {
      'rate_limit_requests_per_minute': { min: 10, max: 1000 },
      'rate_limit_requests_per_hour': { min: 100, max: 10000 },
      'rate_limit_auth_attempts': { min: 3, max: 20 },
      'anomaly_response_time_threshold': { min: 1000, max: 30000 },
      'anomaly_error_rate_threshold': { min: 1, max: 50 },
      'anomaly_request_size_threshold': { min: 1, max: 100 },
      'pattern_confidence_threshold': { min: 50, max: 95 },
      'pattern_risk_score_threshold': { min: 30, max: 90 },
      'risk_score_low_threshold': { min: 10, max: 50 },
      'risk_score_medium_threshold': { min: 40, max: 70 },
      'risk_score_high_threshold': { min: 60, max: 95 },
      'blacklist_auto_add_threshold': { min: 3, max: 50 }
    };

    const rule = validationRules[id];
    if (!rule) {
      return true; // 未定義の場合は許可
    }

    return newValue >= rule.min && newValue <= rule.max;
  }

  /**
   * 動的閾値調整ルールの実行
   */
  async evaluateThresholdRules(context: {
    requestCount: number;
    errorRate: number;
    responseTime: number;
    anomalyCount: number;
    timeWindow: number;
  }): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.isEnabled) continue;

      try {
        if (await this.evaluateRuleCondition(rule, context)) {
          await this.executeRuleAction(rule, context);
        }
      } catch (error) {
        console.error(`Failed to evaluate threshold rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * ルール条件の評価
   */
  private async evaluateRuleCondition(rule: ThresholdRule, context: any): Promise<boolean> {
    try {
      const condition = JSON.parse(rule.condition);
      
      // 簡単な条件評価（実際の実装ではより高度な評価エンジンを使用）
      if (condition.type === 'threshold_exceeded') {
        const value = context[condition.metric];
        return value !== undefined && value > condition.threshold;
      }
      
      if (condition.type === 'rate_increase') {
        const value = context[condition.metric];
        const threshold = await this.getThreshold(condition.thresholdId);
        return threshold && value > threshold.value * condition.multiplier;
      }

      return false;
    } catch (error) {
      console.error(`Failed to evaluate rule condition for ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * ルールアクションの実行
   */
  private async executeRuleAction(rule: ThresholdRule, context: any): Promise<void> {
    const params = rule.parameters;

    switch (rule.action) {
      case 'ADJUST_THRESHOLD':
        if (params.thresholdId && params.adjustment) {
          await this.adjustThresholdAutomatically(
            params.thresholdId,
            params.adjustment,
            `Automatic adjustment triggered by rule: ${rule.name}`,
            { ruleId: rule.id, context }
          );
        }
        break;

      case 'SEND_ALERT':
        console.warn(`Threshold rule alert: ${rule.name}`, {
          ruleId: rule.id,
          context,
          message: params.message
        });
        break;

      case 'ESCALATE':
        console.error(`Threshold rule escalation: ${rule.name}`, {
          ruleId: rule.id,
          context,
          escalationLevel: params.escalationLevel
        });
        break;

      default:
        console.warn(`Unknown rule action: ${rule.action}`);
    }
  }

  /**
   * 設定管理
   */
  async getConfiguration(section: string, key: string): Promise<SecurityConfiguration | null> {
    const configId = `${section}.${key}`;
    return this.configurations.get(configId) || null;
  }

  async updateConfiguration(
    section: string,
    key: string,
    value: any,
    modifiedBy: string
  ): Promise<void> {
    const configId = `${section}.${key}`;
    const existing = this.configurations.get(configId);

    const config: SecurityConfiguration = {
      id: configId,
      section,
      key,
      value,
      dataType: this.inferDataType(value),
      description: existing?.description || '',
      lastModified: new Date(),
      modifiedBy,
      version: (existing?.version || 0) + 1
    };

    this.configurations.set(configId, config);
    console.log(`Configuration updated: ${configId} = ${JSON.stringify(value)} by ${modifiedBy}`);
  }

  /**
   * データ型の推論
   */
  private inferDataType(value: any): SecurityConfiguration['dataType'] {
    if (typeof value === 'string') return 'STRING';
    if (typeof value === 'number') return 'NUMBER';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (Array.isArray(value)) return 'ARRAY';
    if (typeof value === 'object') return 'JSON';
    return 'STRING';
  }

  /**
   * 閾値調整ログの記録
   */
  private async logThresholdAdjustment(log: ThresholdAdjustmentLog): Promise<void> {
    try {
      // 実際の実装ではデータベースに保存
      console.log('Threshold adjustment logged:', {
        id: log.id,
        thresholdId: log.thresholdId,
        change: `${log.oldValue} → ${log.newValue}`,
        reason: log.reason,
        triggeredBy: log.triggeredBy,
        userId: log.userId,
        timestamp: log.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Failed to log threshold adjustment:', error);
    }
  }

  /**
   * 閾値統計の取得
   */
  async getThresholdStatistics(timeRange: { start: Date; end: Date }): Promise<{
    totalAdjustments: number;
    automaticAdjustments: number;
    manualAdjustments: number;
    mostAdjustedThresholds: Array<{ thresholdId: string; adjustmentCount: number }>;
    averageAdjustmentFrequency: number;
  }> {
    // 実際の実装ではデータベースクエリを使用
    return {
      totalAdjustments: 0,
      automaticAdjustments: 0,
      manualAdjustments: 0,
      mostAdjustedThresholds: [],
      averageAdjustmentFrequency: 0
    };
  }

  /**
   * 閾値最適化の提案
   */
  async suggestOptimizations(): Promise<Array<{
    thresholdId: string;
    currentValue: number;
    suggestedValue: number;
    reason: string;
    confidence: number;
  }>> {
    const suggestions: Array<{
      thresholdId: string;
      currentValue: number;
      suggestedValue: number;
      reason: string;
      confidence: number;
    }> = [];

    // 簡単な最適化提案ロジック
    for (const threshold of this.thresholds.values()) {
      if (!threshold.isActive) continue;

      // レート制限の最適化例
      if (threshold.category === 'RATE_LIMIT' && threshold.id === 'rate_limit_requests_per_minute') {
        if (threshold.value < 50) {
          suggestions.push({
            thresholdId: threshold.id,
            currentValue: threshold.value,
            suggestedValue: 75,
            reason: '過度に制限的な設定により正常なユーザーに影響を与える可能性があります',
            confidence: 70
          });
        }
      }

      // 異常検知の最適化例
      if (threshold.category === 'ANOMALY_DETECTION' && threshold.id === 'anomaly_response_time_threshold') {
        if (threshold.value > 10000) {
          suggestions.push({
            thresholdId: threshold.id,
            currentValue: threshold.value,
            suggestedValue: 7000,
            reason: '閾値が高すぎて実際の異常を検知できない可能性があります',
            confidence: 80
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * 閾値設定のエクスポート
   */
  async exportThresholds(): Promise<{
    thresholds: SecurityThreshold[];
    configurations: SecurityConfiguration[];
    exportedAt: Date;
    version: string;
  }> {
    return {
      thresholds: Array.from(this.thresholds.values()),
      configurations: Array.from(this.configurations.values()),
      exportedAt: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * 閾値設定のインポート
   */
  async importThresholds(data: {
    thresholds: SecurityThreshold[];
    configurations: SecurityConfiguration[];
  }, importedBy: string): Promise<void> {
    // バックアップの作成
    const backup = await this.exportThresholds();
    console.log('Created backup before import:', backup.exportedAt);

    // 閾値のインポート
    for (const threshold of data.thresholds) {
      if (this.validateThresholdAdjustment(threshold.id, threshold.value)) {
        threshold.lastModified = new Date();
        threshold.modifiedBy = importedBy;
        this.thresholds.set(threshold.id, threshold);
      } else {
        console.warn(`Skipped invalid threshold during import: ${threshold.id}`);
      }
    }

    // 設定のインポート
    for (const config of data.configurations) {
      config.lastModified = new Date();
      config.modifiedBy = importedBy;
      config.version = (config.version || 0) + 1;
      this.configurations.set(config.id, config);
    }

    console.log(`Imported ${data.thresholds.length} thresholds and ${data.configurations.length} configurations by ${importedBy}`);
  }
}

// シングルトンインスタンス
export const securityThresholdManagerService = new SecurityThresholdManagerService();

export default SecurityThresholdManagerService;