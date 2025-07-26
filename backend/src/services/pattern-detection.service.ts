import { RequestLogData } from '../middleware/request-logger';
import { captureError } from '../config/sentry';

/**
 * パターンベース攻撃検知サービス
 * 正規表現、機械学習、行動分析を組み合わせた高度な攻撃検知
 */

export enum AttackType {
  SQL_INJECTION = 'sql_injection',
  XSS_ATTACK = 'xss_attack',
  COMMAND_INJECTION = 'command_injection',
  PATH_TRAVERSAL = 'path_traversal',
  XXE_ATTACK = 'xxe_attack',
  LDAP_INJECTION = 'ldap_injection',
  NOSQL_INJECTION = 'nosql_injection',
  TEMPLATE_INJECTION = 'template_injection',
  DESERIALIZATION_ATTACK = 'deserialization_attack',
  FILE_INCLUSION = 'file_inclusion',
  SSRF_ATTACK = 'ssrf_attack',
  CSRF_ATTACK = 'csrf_attack',
  CLICKJACKING = 'clickjacking',
  HTTP_POLLUTION = 'http_pollution',
  PROTOCOL_CONFUSION = 'protocol_confusion',
  BUFFER_OVERFLOW = 'buffer_overflow',
  FORMAT_STRING = 'format_string',
  RACE_CONDITION = 'race_condition',
  TIME_BASED_ATTACK = 'time_based_attack',
  BLIND_ATTACK = 'blind_attack'
}

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  attackType: AttackType;
  patterns: {
    regex: RegExp;
    weight: number; // 0-100
    context: 'url' | 'query' | 'body' | 'headers' | 'all';
    caseSensitive: boolean;
  }[];
  threshold: number; // 検知閾値（重み付きスコア）
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
  timeWindow: number; // minutes
  threshold: number;
  confidence: number; // 0-100
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
  // 統計的特徴
  payloadLength: number;
  specialCharRatio: number;
  digitRatio: number;
  upperCaseRatio: number;
  
  // 構造的特徴
  tagCount: number;
  attributeCount: number;
  nestedLevel: number;
  encodingCount: number;
  
  // セマンティック特徴
  sqlKeywordCount: number;
  jsKeywordCount: number;
  urlCount: number;
  emailCount: number;
  
  // エントロピー特徴
  entropy: number;
  compressibility: number;
  
  // 時系列特徴
  requestFrequency: number;
  timeOfDay: number;
  dayOfWeek: number;
  
  // コンテキスト特徴
  endpointType: string;
  httpMethod: string;
  responseCode: number;
  responseTime: number;
}

class PatternDetectionService {
  private patternRules: Map<string, PatternRule> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private mlModel: any = null; // ML model placeholder
  private requestHistory: Map<string, any[]> = new Map();

  constructor() {
    this.initializePatternRules();
    this.initializeBehaviorPatterns();
    this.initializeMLModel();
    this.startPeriodicTasks();
  }

  /**
   * メインの攻撃検知メソッド
   */
  async detectAttacks(logData: RequestLogData): Promise<DetectionResult[]> {
    try {
      const detections: DetectionResult[] = [];

      // 1. パターンベース検知
      const patternDetections = await this.runPatternDetection(logData);
      detections.push(...patternDetections);

      // 2. 行動ベース検知
      const behaviorDetections = await this.runBehaviorDetection(logData);
      detections.push(...behaviorDetections);

      // 3. ML ベース検知
      const mlDetections = await this.runMLDetection(logData);
      detections.push(...mlDetections);

      // 4. 時系列異常検知
      const timeSeriesDetections = await this.runTimeSeriesDetection(logData);
      detections.push(...timeSeriesDetections);

      // 5. アンサンブル検知（複数手法の組み合わせ）
      const ensembleDetections = await this.runEnsembleDetection(logData, detections);

      return [...detections, ...ensembleDetections];

    } catch (error) {
      console.error('Pattern detection error:', error);
      captureError(error as Error, {
        tags: { category: 'pattern_detection', issue: 'detection_error' },
        level: 'warning'
      });
      return [];
    }
  }

  /**
   * パターンベース検知
   */
  private async runPatternDetection(logData: RequestLogData): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    for (const rule of this.patternRules.values()) {
      if (!rule.enabled) continue;

      const detectionResult = await this.checkPatternRule(logData, rule);
      if (detectionResult.detected) {
        detections.push(detectionResult);
      }
    }

    return detections;
  }

  /**
   * 個別パターンルールのチェック
   */
  private async checkPatternRule(logData: RequestLogData, rule: PatternRule): Promise<DetectionResult> {
    const matchedPatterns: any[] = [];
    let totalScore = 0;

    // 検査対象データの準備
    const targets = this.prepareSearchTargets(logData);

    // 各パターンをチェック
    for (const pattern of rule.patterns) {
      const target = this.getTargetData(targets, pattern.context);
      if (!target) continue;

      const flags = pattern.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern.regex.source, flags);
      const matches = target.match(regex);

      if (matches) {
        matches.forEach(match => {
          matchedPatterns.push({
            ruleId: rule.id,
            pattern: pattern.regex.source,
            match,
            weight: pattern.weight,
            context: pattern.context
          });
          totalScore += pattern.weight;
        });
      }
    }

    const detected = totalScore >= rule.threshold;
    const confidence = Math.min((totalScore / rule.threshold) * 100, 100);

    return {
      detected,
      attackType: rule.attackType,
      confidence,
      riskScore: this.calculateRiskScore(rule, totalScore, matchedPatterns),
      matchedPatterns,
      behaviorIndicators: [],
      recommendations: this.generateRecommendations(rule, matchedPatterns),
      evidence: {
        payload: JSON.stringify(targets).substring(0, 1000),
        location: logData.path,
        timestamp: logData.timestamp,
        metadata: {
          totalScore,
          threshold: rule.threshold,
          ruleId: rule.id
        }
      }
    };
  }

  /**
   * 行動ベース検知
   */
  private async runBehaviorDetection(logData: RequestLogData): Promise<DetectionResult[]> {
    const detections: DetectionResult[] = [];

    for (const pattern of this.behaviorPatterns.values()) {
      const indicators = await this.analyzeBehaviorIndicators(logData, pattern);
      const suspiciousCount = indicators.filter(i => i.value > i.threshold).length;

      if (suspiciousCount >= Math.ceil(Object.keys(pattern.indicators).length * 0.6)) {
        detections.push({
          detected: true,
          attackType: AttackType.PROTOCOL_CONFUSION, // 行動ベースは一般的な分類
          confidence: pattern.confidence,
          riskScore: 60 + (suspiciousCount * 10),
          matchedPatterns: [],
          behaviorIndicators: indicators,
          recommendations: ['Monitor user behavior closely', 'Consider rate limiting'],
          evidence: {
            payload: 'Behavioral analysis',
            location: logData.path,
            timestamp: logData.timestamp,
            metadata: { patternId: pattern.id, indicators }
          }
        });
      }
    }

    return detections;
  }

  /**
   * 機械学習ベース検知
   */
  private async runMLDetection(logData: RequestLogData): Promise<DetectionResult[]> {
    if (!this.mlModel) {
      return [];
    }

    try {
      const features = this.extractMLFeatures(logData);
      const prediction = await this.mlModel.predict(features);

      if (prediction.anomalyScore > 0.7) {
        return [{
          detected: true,
          attackType: prediction.predictedAttackType || AttackType.PROTOCOL_CONFUSION,
          confidence: prediction.confidence * 100,
          riskScore: prediction.anomalyScore * 100,
          matchedPatterns: [],
          behaviorIndicators: [],
          recommendations: ['ML-based anomaly detected', 'Manual review recommended'],
          evidence: {
            payload: 'ML analysis',
            location: logData.path,
            timestamp: logData.timestamp,
            metadata: {
              features,
              prediction,
              modelVersion: this.mlModel.version
            }
          }
        }];
      }

      return [];

    } catch (error) {
      console.error('ML detection error:', error);
      return [];
    }
  }

  /**
   * 時系列異常検知
   */
  private async runTimeSeriesDetection(logData: RequestLogData): Promise<DetectionResult[]> {
    const key = logData.ipAddress;
    const history = this.requestHistory.get(key) || [];
    
    // 履歴に現在のリクエストを追加
    history.push({
      timestamp: logData.timestamp.getTime(),
      path: logData.path,
      method: logData.method,
      responseTime: logData.responseTime,
      statusCode: logData.statusCode
    });

    // 履歴を最新100件に制限
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    this.requestHistory.set(key, history);

    // 時系列異常の検出
    const anomalies = this.detectTimeSeriesAnomalies(history);

    return anomalies.map(anomaly => ({
      detected: true,
      attackType: AttackType.TIME_BASED_ATTACK,
      confidence: anomaly.confidence,
      riskScore: anomaly.score,
      matchedPatterns: [],
      behaviorIndicators: [],
      recommendations: ['Time-based anomaly detected'],
      evidence: {
        payload: 'Time series analysis',
        location: logData.path,
        timestamp: logData.timestamp,
        metadata: anomaly
      }
    }));
  }

  /**
   * アンサンブル検知
   */
  private async runEnsembleDetection(logData: RequestLogData, previousDetections: DetectionResult[]): Promise<DetectionResult[]> {
    if (previousDetections.length < 2) {
      return [];
    }

    // 複数の検知手法で同じ攻撃タイプが検出された場合の信頼度向上
    const attackTypeCounts = new Map<AttackType, DetectionResult[]>();
    
    previousDetections.forEach(detection => {
      if (!attackTypeCounts.has(detection.attackType)) {
        attackTypeCounts.set(detection.attackType, []);
      }
      attackTypeCounts.get(detection.attackType)!.push(detection);
    });

    const ensembleDetections: DetectionResult[] = [];

    for (const [attackType, detections] of attackTypeCounts.entries()) {
      if (detections.length >= 2) {
        const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
        const maxRiskScore = Math.max(...detections.map(d => d.riskScore));

        ensembleDetections.push({
          detected: true,
          attackType,
          confidence: Math.min(avgConfidence * 1.2, 100), // アンサンブルボーナス
          riskScore: Math.min(maxRiskScore * 1.1, 100),
          matchedPatterns: detections.flatMap(d => d.matchedPatterns),
          behaviorIndicators: detections.flatMap(d => d.behaviorIndicators),
          recommendations: ['Multiple detection methods agree', 'High confidence threat'],
          evidence: {
            payload: 'Ensemble analysis',
            location: logData.path,
            timestamp: logData.timestamp,
            metadata: {
              detectionCount: detections.length,
              methods: detections.map((_, i) => `method_${i}`)
            }
          }
        });
      }
    }

    return ensembleDetections;
  }

  /**
   * パターンルールの初期化
   */
  private initializePatternRules(): void {
    const rules: PatternRule[] = [
      {
        id: 'advanced_sql_injection',
        name: 'Advanced SQL Injection',
        description: 'Detects sophisticated SQL injection attempts',
        attackType: AttackType.SQL_INJECTION,
        patterns: [
          {
            regex: /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b.*\bWHERE\b.*(\bOR\b|\bAND\b).*=.*)/i,
            weight: 80,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /((\bCAST\b|\bCONVERT\b|\bCONCAT\b).*\(.*\)|\b(WAITFOR|DELAY|BENCHMARK|SLEEP)\b.*\()/i,
            weight: 70,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSTABLES|PG_USER)\b|@@\w+)/i,
            weight: 60,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /([\'\"][\s]*(\bOR\b|\bAND\b)[\s]*[\'\"]?[\s]*=[\s]*[\'\"]?|[\'\"][\s]*(\bOR\b|\bAND\b)[\s]*\d+[\s]*=[\s]*\d+)/i,
            weight: 50,
            context: 'all',
            caseSensitive: false
          }
        ],
        threshold: 60,
        severity: 'high',
        enabled: true,
        falsePositiveRate: 0.02,
        lastUpdated: new Date()
      },
      {
        id: 'xss_advanced',
        name: 'Advanced XSS Detection',
        description: 'Detects sophisticated XSS attempts including DOM and stored XSS',
        attackType: AttackType.XSS_ATTACK,
        patterns: [
          {
            regex: /<script[^>]*>.*<\/script>|javascript:[^\"\']*|vbscript:[^\"\']*|on\w+\s*=\s*["\'][^"\']*["\']|<iframe[^>]*>|<object[^>]*>|<embed[^>]*>/i,
            weight: 90,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(eval\s*\(|setTimeout\s*\(|setInterval\s*\(|Function\s*\(|execScript\s*\()/i,
            weight: 70,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(document\.(write|writeln|cookie|location)|window\.(location|open)|location\.(href|replace))/i,
            weight: 60,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(\&\#x?[0-9a-f]+;|%[0-9a-f]{2}|\\u[0-9a-f]{4}|\\x[0-9a-f]{2})/i,
            weight: 40,
            context: 'all',
            caseSensitive: false
          }
        ],
        threshold: 70,
        severity: 'high',
        enabled: true,
        falsePositiveRate: 0.03,
        lastUpdated: new Date()
      },
      {
        id: 'command_injection',
        name: 'Command Injection',
        description: 'Detects command injection attempts',
        attackType: AttackType.COMMAND_INJECTION,
        patterns: [
          {
            regex: /(;|\||\&\&|\|\|)\s*(cat|ls|pwd|id|whoami|ps|kill|rm|mv|cp|chmod|chown)\s/i,
            weight: 90,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(`|\$\(|%\{)(cat|ls|pwd|id|whoami|ps|netstat|ifconfig|uname)/i,
            weight: 85,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(\/bin\/(sh|bash|csh|tcsh|ksh)|cmd\.exe|powershell|wscript|cscript)/i,
            weight: 80,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(nc\s+-|netcat\s+-|telnet\s+|ssh\s+|wget\s+|curl\s+)/i,
            weight: 70,
            context: 'all',
            caseSensitive: false
          }
        ],
        threshold: 75,
        severity: 'critical',
        enabled: true,
        falsePositiveRate: 0.01,
        lastUpdated: new Date()
      },
      {
        id: 'path_traversal',
        name: 'Path Traversal',
        description: 'Detects directory traversal attempts',
        attackType: AttackType.PATH_TRAVERSAL,
        patterns: [
          {
            regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|%252e%252e%252f)/i,
            weight: 80,
            context: 'url',
            caseSensitive: false
          },
          {
            regex: /(\/etc\/passwd|\/etc\/shadow|\/etc\/hosts|\/proc\/version|\/proc\/self\/environ)/i,
            weight: 90,
            context: 'all',
            caseSensitive: false
          },
          {
            regex: /(c:\\windows\\system32|c:\\users|\\windows\\system32|boot\.ini|win\.ini)/i,
            weight: 85,
            context: 'all',
            caseSensitive: false
          }
        ],
        threshold: 70,
        severity: 'high',
        enabled: true,
        falsePositiveRate: 0.02,
        lastUpdated: new Date()
      },
      {
        id: 'xxe_attack',
        name: 'XXE Attack',
        description: 'Detects XML External Entity attacks',
        attackType: AttackType.XXE_ATTACK,
        patterns: [
          {
            regex: /<!ENTITY[^>]*>/i,
            weight: 70,
            context: 'body',
            caseSensitive: false
          },
          {
            regex: /<!DOCTYPE[^>]*\[.*<!ENTITY/is,
            weight: 90,
            context: 'body',
            caseSensitive: false
          },
          {
            regex: /SYSTEM\s+["\'].*["\']|PUBLIC\s+["\'][^"\']*["\'][^>]*>/i,
            weight: 80,
            context: 'body',
            caseSensitive: false
          }
        ],
        threshold: 70,
        severity: 'high',
        enabled: true,
        falsePositiveRate: 0.01,
        lastUpdated: new Date()
      },
      {
        id: 'template_injection',
        name: 'Template Injection',
        description: 'Detects template injection attempts',
        attackType: AttackType.TEMPLATE_INJECTION,
        patterns: [
          {
            regex: /\{\{.*\}\}|\$\{.*\}|<%.*%>|#\{.*\}/,
            weight: 60,
            context: 'all',
            caseSensitive: true
          },
          {
            regex: /\{\{.*\.(constructor|prototype|__proto__).*\}\}/,
            weight: 90,
            context: 'all',
            caseSensitive: true
          },
          {
            regex: /\{\{.*['"]\)\]\}.*\}\}/,
            weight: 85,
            context: 'all',
            caseSensitive: true
          }
        ],
        threshold: 60,
        severity: 'medium',
        enabled: true,
        falsePositiveRate: 0.05,
        lastUpdated: new Date()
      }
    ];

    rules.forEach(rule => {
      this.patternRules.set(rule.id, rule);
    });
  }

  /**
   * 行動パターンの初期化
   */
  private initializeBehaviorPatterns(): void {
    const patterns: BehaviorPattern[] = [
      {
        id: 'rapid_requests',
        name: 'Rapid Request Pattern',
        description: 'Detects unusually rapid request patterns',
        indicators: {
          rapidRequests: true,
          errorRateIncrease: true,
          unusualUserAgent: false,
          geographicalAnomaly: false,
          timeBasedAnomaly: false,
          sequentialPatterns: true,
          headerAnomalies: false,
          payloadSizeAnomalies: false
        },
        timeWindow: 5,
        threshold: 50,
        confidence: 75
      },
      {
        id: 'scanner_behavior',
        name: 'Scanner Behavior Pattern',
        description: 'Detects automated scanning behavior',
        indicators: {
          rapidRequests: true,
          errorRateIncrease: true,
          unusualUserAgent: true,
          geographicalAnomaly: false,
          timeBasedAnomaly: false,
          sequentialPatterns: true,
          headerAnomalies: true,
          payloadSizeAnomalies: false
        },
        timeWindow: 10,
        threshold: 30,
        confidence: 85
      }
    ];

    patterns.forEach(pattern => {
      this.behaviorPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * 機械学習モデルの初期化
   */
  private initializeMLModel(): void {
    // 実際の実装では、訓練済みモデルをロード
    this.mlModel = {
      version: '1.0.0',
      predict: async (features: MLFeatures) => {
        // モックプレディクション
        const anomalyScore = Math.random() * 0.3; // 通常は低いスコア
        
        if (features.specialCharRatio > 0.5 || features.entropy > 7) {
          return {
            anomalyScore: 0.8 + Math.random() * 0.2,
            confidence: 0.85,
            predictedAttackType: AttackType.XSS_ATTACK
          };
        }

        return {
          anomalyScore,
          confidence: 0.6,
          predictedAttackType: null
        };
      }
    };
  }

  /**
   * ユーティリティメソッド
   */
  private prepareSearchTargets(logData: RequestLogData): Record<string, string> {
    return {
      url: logData.url,
      query: JSON.stringify(logData.query),
      body: JSON.stringify(logData.query), // RequestLogDataにbodyがない場合の代替
      headers: JSON.stringify(logData.headers),
      all: `${logData.url} ${JSON.stringify(logData.query)} ${JSON.stringify(logData.headers)}`
    };
  }

  private getTargetData(targets: Record<string, string>, context: string): string {
    return targets[context] || targets['all'];
  }

  private calculateRiskScore(rule: PatternRule, score: number, matches: any[]): number {
    let riskScore = (score / rule.threshold) * 50; // ベーススコア

    // セベリティによる調整
    switch (rule.severity) {
      case 'critical': riskScore += 30; break;
      case 'high': riskScore += 20; break;
      case 'medium': riskScore += 10; break;
      case 'low': riskScore += 5; break;
    }

    // マッチ数による調整
    riskScore += Math.min(matches.length * 5, 20);

    return Math.min(Math.round(riskScore), 100);
  }

  private generateRecommendations(rule: PatternRule, matches: any[]): string[] {
    const recommendations = [`Block request matching ${rule.name}`];

    if (matches.length > 3) {
      recommendations.push('Multiple attack patterns detected - consider IP blocking');
    }

    if (rule.severity === 'critical') {
      recommendations.push('Critical threat detected - immediate action required');
    }

    recommendations.push('Review security logs for similar patterns');
    
    return recommendations;
  }

  private async analyzeBehaviorIndicators(logData: RequestLogData, pattern: BehaviorPattern): Promise<any[]> {
    const indicators: any[] = [];

    if (pattern.indicators.rapidRequests) {
      const frequency = await this.calculateRequestFrequency(logData.ipAddress, pattern.timeWindow);
      indicators.push({
        indicator: 'rapidRequests',
        value: frequency,
        threshold: 50,
        severity: frequency > 100 ? 'high' : frequency > 50 ? 'medium' : 'low'
      });
    }

    if (pattern.indicators.errorRateIncrease) {
      const errorRate = await this.calculateErrorRate(logData.ipAddress, pattern.timeWindow);
      indicators.push({
        indicator: 'errorRateIncrease',
        value: errorRate,
        threshold: 0.5,
        severity: errorRate > 0.8 ? 'high' : errorRate > 0.5 ? 'medium' : 'low'
      });
    }

    if (pattern.indicators.unusualUserAgent) {
      const isUnusual = this.isUnusualUserAgent(logData.userAgent);
      indicators.push({
        indicator: 'unusualUserAgent',
        value: isUnusual ? 1 : 0,
        threshold: 0.5,
        severity: isUnusual ? 'medium' : 'low'
      });
    }

    return indicators;
  }

  private extractMLFeatures(logData: RequestLogData): MLFeatures {
    const payload = `${logData.url} ${JSON.stringify(logData.query)}`;
    
    return {
      payloadLength: payload.length,
      specialCharRatio: (payload.match(/[<>'"();{}[\]]/g) || []).length / payload.length,
      digitRatio: (payload.match(/\d/g) || []).length / payload.length,
      upperCaseRatio: (payload.match(/[A-Z]/g) || []).length / payload.length,
      
      tagCount: (payload.match(/<[^>]*>/g) || []).length,
      attributeCount: (payload.match(/\s+\w+\s*=/g) || []).length,
      nestedLevel: this.calculateNestedLevel(payload),
      encodingCount: (payload.match(/(%[0-9a-f]{2}|&#\d+;|&#x[0-9a-f]+;)/gi) || []).length,
      
      sqlKeywordCount: this.countSQLKeywords(payload),
      jsKeywordCount: this.countJSKeywords(payload),
      urlCount: (payload.match(/https?:\/\/[^\s]+/g) || []).length,
      emailCount: (payload.match(/[^\s]+@[^\s]+\.[^\s]+/g) || []).length,
      
      entropy: this.calculateEntropy(payload),
      compressibility: this.calculateCompressibility(payload),
      
      requestFrequency: 0, // 後で計算
      timeOfDay: logData.timestamp.getHours(),
      dayOfWeek: logData.timestamp.getDay(),
      
      endpointType: this.categorizeEndpoint(logData.path),
      httpMethod: logData.method,
      responseCode: logData.statusCode || 0,
      responseTime: logData.responseTime || 0
    };
  }

  private detectTimeSeriesAnomalies(history: any[]): any[] {
    if (history.length < 10) return [];

    const anomalies: any[] = [];
    
    // 時間間隔の異常検知
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i-1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const rapidRequests = intervals.filter(interval => interval < avgInterval * 0.1).length;

    if (rapidRequests > intervals.length * 0.3) {
      anomalies.push({
        type: 'rapid_requests',
        confidence: 80,
        score: 70,
        details: { rapidRequests, totalRequests: intervals.length }
      });
    }

    // レスポンス時間の異常検知
    const responseTimes = history.map(h => h.responseTime).filter(rt => rt > 0);
    if (responseTimes.length > 5) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const slowRequests = responseTimes.filter(rt => rt > avgResponseTime * 3).length;

      if (slowRequests > responseTimes.length * 0.2) {
        anomalies.push({
          type: 'slow_requests',
          confidence: 70,
          score: 60,
          details: { slowRequests, avgResponseTime }
        });
      }
    }

    return anomalies;
  }

  // ヘルパーメソッド
  private async calculateRequestFrequency(ipAddress: string, windowMinutes: number): Promise<number> {
    // 実装簡略化
    return Math.random() * 100;
  }

  private async calculateErrorRate(ipAddress: string, windowMinutes: number): Promise<number> {
    // 実装簡略化
    return Math.random() * 0.5;
  }

  private isUnusualUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scanner/i,
      /curl/i, /wget/i, /python/i, /java/i,
      /sqlmap/i, /nmap/i, /nikto/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent)) ||
           userAgent.length < 10 || userAgent.length > 500;
  }

  private calculateNestedLevel(payload: string): number {
    let maxLevel = 0;
    let currentLevel = 0;

    for (const char of payload) {
      if (char === '<' || char === '(' || char === '{' || char === '[') {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === '>' || char === ')' || char === '}' || char === ']') {
        currentLevel = Math.max(0, currentLevel - 1);
      }
    }

    return maxLevel;
  }

  private countSQLKeywords(payload: string): number {
    const keywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'UNION', 'WHERE', 'FROM',
      'JOIN', 'ORDER', 'GROUP', 'HAVING', 'CREATE', 'DROP', 'ALTER'
    ];
    
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return count + (payload.match(regex) || []).length;
    }, 0);
  }

  private countJSKeywords(payload: string): number {
    const keywords = [
      'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
      'return', 'eval', 'alert', 'confirm', 'prompt', 'document', 'window'
    ];
    
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      return count + (payload.match(regex) || []).length;
    }, 0);
  }

  private calculateEntropy(data: string): number {
    const frequency: Record<string, number> = {};
    
    for (const char of data) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const length = data.length;

    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  private calculateCompressibility(data: string): number {
    // 簡単な圧縮可能性の測定
    const repeatedChars = data.match(/(.)\1{2,}/g) || [];
    const repeatedPatterns = data.match(/(.{2,})\1+/g) || [];
    
    return (repeatedChars.length + repeatedPatterns.length) / data.length;
  }

  private categorizeEndpoint(path: string): string {
    if (path.includes('/api/auth')) return 'authentication';
    if (path.includes('/api/admin')) return 'administration';
    if (path.includes('/api/')) return 'api';
    if (path.includes('/upload')) return 'upload';
    return 'general';
  }

  private startPeriodicTasks(): void {
    // 古い履歴データのクリーンアップ
    setInterval(() => {
      this.cleanupRequestHistory();
    }, 10 * 60 * 1000); // 10分ごと

    // パターンルールの更新チェック
    setInterval(() => {
      this.updatePatternRules();
    }, 60 * 60 * 1000); // 1時間ごと
  }

  private cleanupRequestHistory(): void {
    const maxAge = 30 * 60 * 1000; // 30分
    const now = Date.now();

    for (const [key, history] of this.requestHistory.entries()) {
      const filtered = history.filter(item => now - item.timestamp < maxAge);
      if (filtered.length === 0) {
        this.requestHistory.delete(key);
      } else {
        this.requestHistory.set(key, filtered);
      }
    }
  }

  private async updatePatternRules(): void {
    // 外部ソースからの脅威インテリジェンス更新
    console.log('Updating pattern rules with latest threat intelligence...');
  }

  /**
   * 公開メソッド
   */
  getPatternRules(): PatternRule[] {
    return Array.from(this.patternRules.values());
  }

  updatePatternRule(ruleId: string, updates: Partial<PatternRule>): boolean {
    const rule = this.patternRules.get(ruleId);
    if (!rule) return false;

    this.patternRules.set(ruleId, { ...rule, ...updates, lastUpdated: new Date() });
    return true;
  }

  addPatternRule(rule: PatternRule): void {
    this.patternRules.set(rule.id, rule);
  }

  removePatternRule(ruleId: string): boolean {
    return this.patternRules.delete(ruleId);
  }

  getBehaviorPatterns(): BehaviorPattern[] {
    return Array.from(this.behaviorPatterns.values());
  }

  getDetectionStats(): any {
    return {
      patternRules: this.patternRules.size,
      behaviorPatterns: this.behaviorPatterns.size,
      mlModelVersion: this.mlModel?.version,
      activeHistoryEntries: Array.from(this.requestHistory.values()).reduce((total, history) => total + history.length, 0)
    };
  }
}

// シングルトンインスタンス
export const patternDetectionService = new PatternDetectionService();

export default PatternDetectionService;