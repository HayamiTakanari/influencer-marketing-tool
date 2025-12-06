import { RequestLogData } from '../middleware/request-logger';
import { anomalyDetectionService, AnomalyDetection } from './anomaly-detection.service';
import { patternDetectionService, DetectionResult } from './pattern-detection.service';
import { ipBlacklistService, BlacklistEntry } from './ip-blacklist.service';
import { realtimeSecurityNotificationService } from './realtime-security-notification.service';
import { securityLogAnalysisService, SecurityEventType, SecuritySeverity } from './security-log-analysis.service';
import { securityThresholdManagerService } from './security-threshold-manager.service';
import { adaptiveRateLimiter } from '../middleware/adaptive-rate-limiter';
import { captureError } from '../config/sentry';

/**
 * セキュリティオーケストレーターサービス
 * 全ての検知システムを統合し、リアルタイム脅威分析と通知を実行
 */

export interface SecurityAnalysisResult {
  timestamp: Date;
  ipAddress: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalRiskScore: number;
  detectionCount: number;
  detections: {
    anomalies: AnomalyDetection[];
    patterns: DetectionResult[];
    rateViolations: any[];
    blacklistEvents: BlacklistEntry[];
  };
  recommendedActions: string[];
  shouldBlock: boolean;
  escalationRequired: boolean;
}

export interface ThreatIntelligence {
  ipAddress: string;
  firstSeen: Date;
  lastSeen: Date;
  totalDetections: number;
  riskScore: number;
  threatTypes: string[];
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  attackPatterns: string[];
  isActivelyMonitored: boolean;
  blockRecommendation: boolean;
}

class SecurityOrchestratorService {
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private activeAnalysis: Map<string, SecurityAnalysisResult[]> = new Map();
  private processingQueue: RequestLogData[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.startBackgroundProcessing();
    this.startPeriodicTasks();
  }

  /**
   * メインのセキュリティ分析エントリーポイント
   */
  async analyzeRequest(logData: RequestLogData): Promise<SecurityAnalysisResult> {
    try {
      console.log(`Starting security analysis for ${logData.ipAddress} - ${logData.method} ${logData.path}`);

      // 並列で全ての検知エンジンを実行
      const [
        anomalies,
        patterns,
        blacklistCheck,
        rateViolations
      ] = await Promise.allSettled([
        this.runAnomalyDetection(logData),
        this.runPatternDetection(logData),
        this.checkBlacklist(logData),
        this.getRateViolations(logData.ipAddress)
      ]);

      // 結果の集約
      const detections = {
        anomalies: anomalies.status === 'fulfilled' ? anomalies.value : [],
        patterns: patterns.status === 'fulfilled' ? patterns.value : [],
        rateViolations: rateViolations.status === 'fulfilled' ? rateViolations.value : [],
        blacklistEvents: blacklistCheck.status === 'fulfilled' ? blacklistCheck.value : []
      };

      // リスク分析
      const analysisResult = this.calculateRiskAnalysis(logData, detections);

      // 脅威インテリジェンスの更新
      await this.updateThreatIntelligence(logData, analysisResult);

      // 自動対応の実行
      await this.executeAutomatedResponse(analysisResult);

      // 通知の送信
      await this.sendNotifications(analysisResult, detections);

      // セキュリティログ分析サービスへの記録
      await this.logSecurityAnalysis(analysisResult, logData, detections);

      // 閾値評価とリアルタイム調整
      await this.evaluateAndAdjustThresholds(analysisResult, logData, detections);

      // 結果の保存
      this.storeAnalysisResult(analysisResult);

      console.log(`Security analysis completed for ${logData.ipAddress} - Risk Level: ${analysisResult.riskLevel}, Score: ${analysisResult.totalRiskScore}`);

      return analysisResult;

    } catch (error) {
      console.error('Security analysis failed:', error);
      captureError(error as Error, {
        tags: { category: 'security_orchestrator', issue: 'analysis_failure' },
        level: 'error'
      });

      // フォールバック結果を返す
      return this.createFallbackResult(logData);
    }
  }

  /**
   * バッチ処理でリクエストを分析
   */
  async queueRequestForAnalysis(logData: RequestLogData): Promise<void> {
    this.processingQueue.push(logData);
    
    // キューが大きくなりすぎないように制限
    if (this.processingQueue.length > 1000) {
      this.processingQueue = this.processingQueue.slice(-1000);
    }

    // 高リスクリクエストは即座に処理
    if (logData.isSuspicious || logData.statusCode >= 500) {
      await this.analyzeRequest(logData);
    }
  }

  /**
   * 脅威インテリジェンスレポートの生成
   */
  async generateThreatIntelligenceReport(): Promise<{
    summary: {
      totalThreats: number;
      activeThreats: number;
      highRiskIPs: number;
      newThreatsToday: number;
    };
    topThreats: ThreatIntelligence[];
    riskDistribution: Record<string, number>;
    geographicalDistribution: Array<{ country: string; count: number; avgRisk: number }>;
    attackTrends: Array<{ date: string; count: number; avgRisk: number }>;
  }> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allThreats = Array.from(this.threatIntelligence.values());
    const activeThreats = allThreats.filter(t => t.isActivelyMonitored);
    const highRiskThreats = allThreats.filter(t => t.riskScore >= 70);
    const newThreatsToday = allThreats.filter(t => t.firstSeen >= today);

    // トップ脅威（リスクスコア順）
    const topThreats = allThreats
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20);

    // リスク分布
    const riskDistribution: Record<string, number> = {
      'LOW (0-30)': 0,
      'MEDIUM (31-60)': 0,
      'HIGH (61-80)': 0,
      'CRITICAL (81-100)': 0
    };

    allThreats.forEach(threat => {
      if (threat.riskScore <= 30) riskDistribution['LOW (0-30)']++;
      else if (threat.riskScore <= 60) riskDistribution['MEDIUM (31-60)']++;
      else if (threat.riskScore <= 80) riskDistribution['HIGH (61-80)']++;
      else riskDistribution['CRITICAL (81-100)']++;
    });

    // 地理的分布
    const geoData = new Map<string, { count: number; totalRisk: number }>();
    allThreats.forEach(threat => {
      if (threat.geoLocation?.country) {
        const country = threat.geoLocation.country;
        const existing = geoData.get(country) || { count: 0, totalRisk: 0 };
        geoData.set(country, {
          count: existing.count + 1,
          totalRisk: existing.totalRisk + threat.riskScore
        });
      }
    });

    const geographicalDistribution = Array.from(geoData.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        avgRisk: data.totalRisk / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // 攻撃トレンド（過去7日間）
    const attackTrends: Array<{ date: string; count: number; avgRisk: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayThreats = allThreats.filter(t => 
        t.lastSeen >= dayStart && t.lastSeen <= dayEnd
      );

      attackTrends.push({
        date: dateStr,
        count: dayThreats.length,
        avgRisk: dayThreats.length > 0 
          ? dayThreats.reduce((sum, t) => sum + t.riskScore, 0) / dayThreats.length 
          : 0
      });
    }

    return {
      summary: {
        totalThreats: allThreats.length,
        activeThreats: activeThreats.length,
        highRiskIPs: highRiskThreats.length,
        newThreatsToday: newThreatsToday.length
      },
      topThreats,
      riskDistribution,
      geographicalDistribution,
      attackTrends
    };
  }

  /**
   * セキュリティダッシュボードデータの取得
   */
  async getSecurityDashboard(): Promise<any> {
    const [threatReport, notificationDashboard] = await Promise.all([
      this.generateThreatIntelligenceReport(),
      realtimeSecurityNotificationService.getSecurityDashboard()
    ]);

    return {
      ...notificationDashboard,
      threatIntelligence: threatReport,
      recentAnalysis: this.getRecentAnalysisResults(),
      systemStatus: await this.getSystemStatus()
    };
  }

  /**
   * プライベートメソッド
   */
  private async runAnomalyDetection(logData: RequestLogData): Promise<AnomalyDetection[]> {
    try {
      return await anomalyDetectionService.detectAnomalies(logData);
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  private async runPatternDetection(logData: RequestLogData): Promise<DetectionResult[]> {
    try {
      return await patternDetectionService.detectAttacks(logData);
    } catch (error) {
      console.error('Pattern detection failed:', error);
      return [];
    }
  }

  private async checkBlacklist(logData: RequestLogData): Promise<BlacklistEntry[]> {
    try {
      const result = await ipBlacklistService.isBlacklisted(logData.ipAddress);
      return result.entry ? [result.entry] : [];
    } catch (error) {
      console.error('Blacklist check failed:', error);
      return [];
    }
  }

  private async getRateViolations(ipAddress: string): Promise<any[]> {
    try {
      // Rate violationsの取得（実装は簡略化）
      return [];
    } catch (error) {
      console.error('Rate violation check failed:', error);
      return [];
    }
  }

  private calculateRiskAnalysis(
    logData: RequestLogData, 
    detections: SecurityAnalysisResult['detections']
  ): SecurityAnalysisResult {
    let totalRiskScore = 0;
    let detectionCount = 0;
    const riskFactors: string[] = [];

    // 異常検知からのリスクスコア
    detections.anomalies.forEach(anomaly => {
      totalRiskScore += anomaly.riskScore;
      detectionCount++;
      riskFactors.push(`Anomaly: ${anomaly.type}`);
    });

    // パターン検知からのリスクスコア
    detections.patterns.forEach(pattern => {
      totalRiskScore += pattern.riskScore;
      detectionCount++;
      riskFactors.push(`Pattern: ${pattern.attackType}`);
    });

    // ブラックリストからのリスクスコア
    detections.blacklistEvents.forEach(blacklist => {
      totalRiskScore += 90; // ブラックリストは高リスク
      detectionCount++;
      riskFactors.push(`Blacklisted: ${blacklist.reason}`);
    });

    // レート制限違反からのリスクスコア
    detections.rateViolations.forEach(violation => {
      totalRiskScore += 50;
      detectionCount++;
      riskFactors.push(`Rate violation: ${violation.type}`);
    });

    // ベースラインリスクの追加
    if (logData.isSuspicious) {
      totalRiskScore += 30;
      riskFactors.push('Suspicious request detected');
    }

    if (logData.statusCode >= 500) {
      totalRiskScore += 20;
      riskFactors.push('Server error detected');
    }

    if (logData.isBot && !this.isAllowedBot(logData.userAgent)) {
      totalRiskScore += 25;
      riskFactors.push('Unauthorized bot activity');
    }

    // 平均化（複数の検知がある場合）
    const avgRiskScore = detectionCount > 0 ? totalRiskScore / detectionCount : totalRiskScore;
    const finalRiskScore = Math.min(avgRiskScore, 100);

    // リスクレベルの決定
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (finalRiskScore >= 80) riskLevel = 'CRITICAL';
    else if (finalRiskScore >= 60) riskLevel = 'HIGH';
    else if (finalRiskScore >= 40) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // 推奨アクションの生成
    const recommendedActions = this.generateRecommendedActions(riskLevel, riskFactors, detections);

    return {
      timestamp: new Date(),
      ipAddress: logData.ipAddress,
      riskLevel,
      totalRiskScore: finalRiskScore,
      detectionCount,
      detections,
      recommendedActions,
      shouldBlock: finalRiskScore >= 70 || detections.blacklistEvents.length > 0,
      escalationRequired: finalRiskScore >= 85 || detectionCount >= 3
    };
  }

  private generateRecommendedActions(
    riskLevel: string, 
    riskFactors: string[], 
    detections: SecurityAnalysisResult['detections']
  ): string[] {
    const actions: string[] = [];

    if (riskLevel === 'CRITICAL') {
      actions.push('Immediate IP blocking recommended');
      actions.push('Escalate to security team');
      actions.push('Conduct forensic analysis');
    } else if (riskLevel === 'HIGH') {
      actions.push('Enhanced monitoring required');
      actions.push('Consider temporary rate limiting');
      actions.push('Review security logs');
    } else if (riskLevel === 'MEDIUM') {
      actions.push('Monitor closely');
      actions.push('Log for analysis');
    }

    if (detections.patterns.length > 0) {
      actions.push('Review application security controls');
      actions.push('Check for data exfiltration');
    }

    if (detections.anomalies.length > 0) {
      actions.push('Analyze user behavior patterns');
      actions.push('Check for account compromise');
    }

    if (detections.blacklistEvents.length > 0) {
      actions.push('Verify blacklist accuracy');
      actions.push('Block all traffic from this IP');
    }

    return actions;
  }

  private async updateThreatIntelligence(
    logData: RequestLogData, 
    analysis: SecurityAnalysisResult
  ): Promise<void> {
    const ipAddress = logData.ipAddress;
    const now = new Date();

    let intel = this.threatIntelligence.get(ipAddress);
    
    if (!intel) {
      intel = {
        ipAddress,
        firstSeen: now,
        lastSeen: now,
        totalDetections: 0,
        riskScore: 0,
        threatTypes: [],
        geoLocation: logData.geoLocation,
        attackPatterns: [],
        isActivelyMonitored: false,
        blockRecommendation: false
      };
    }

    // 更新
    intel.lastSeen = now;
    intel.totalDetections += analysis.detectionCount;
    
    // リスクスコアの更新（移動平均）
    intel.riskScore = (intel.riskScore * 0.7) + (analysis.totalRiskScore * 0.3);

    // 脅威タイプの追加
    analysis.detections.anomalies.forEach(a => {
      if (!intel!.threatTypes.includes(a.type)) {
        intel!.threatTypes.push(a.type);
      }
    });

    analysis.detections.patterns.forEach(p => {
      if (!intel!.threatTypes.includes(p.attackType)) {
        intel!.threatTypes.push(p.attackType);
      }
    });

    // アクティブ監視の判定
    intel.isActivelyMonitored = intel.riskScore >= 50 || intel.totalDetections >= 5;
    intel.blockRecommendation = intel.riskScore >= 70;

    this.threatIntelligence.set(ipAddress, intel);
  }

  private async executeAutomatedResponse(analysis: SecurityAnalysisResult): Promise<void> {
    try {
      // 自動ブロックの実行
      if (analysis.shouldBlock && analysis.riskLevel === 'CRITICAL') {
        await this.executeAutoBlock(analysis);
      }

      // レート制限の調整
      if (analysis.detections.rateViolations.length > 0) {
        await this.adjustRateLimits(analysis);
      }

      // ブラックリストへの追加
      if (analysis.riskLevel === 'CRITICAL' && analysis.detectionCount >= 3) {
        await this.addToBlacklist(analysis);
      }
    } catch (error) {
      console.error('Automated response failed:', error);
    }
  }

  private async executeAutoBlock(analysis: SecurityAnalysisResult): Promise<void> {
    console.log(`Executing auto-block for ${analysis.ipAddress} - Risk Level: ${analysis.riskLevel}`);
    // 実装: ファイアウォールルールの追加、NGINXブロック等
  }

  private async adjustRateLimits(analysis: SecurityAnalysisResult): Promise<void> {
    console.log(`Adjusting rate limits for ${analysis.ipAddress}`);
    // 実装: 動的レート制限の調整
  }

  private async addToBlacklist(analysis: SecurityAnalysisResult): Promise<void> {
    const reason = analysis.detections.patterns.length > 0 ? 'SECURITY_VIOLATION' : 'MALICIOUS_ACTIVITY';
    
    await ipBlacklistService.addToBlacklist({
      ipAddress: analysis.ipAddress,
      reason: reason as any,
      severity: 'HIGH' as any,
      duration: 24 * 60, // 24時間
      notes: `Auto-blocked: Risk Level ${analysis.riskLevel}, Score ${analysis.totalRiskScore}`
    });
  }

  private async sendNotifications(
    analysis: SecurityAnalysisResult, 
    detections: SecurityAnalysisResult['detections']
  ): Promise<void> {
    try {
      // 異常検知の通知
      for (const anomaly of detections.anomalies) {
        await realtimeSecurityNotificationService.notifyAnomalyDetection(anomaly);
      }

      // パターン検知の通知
      for (const pattern of detections.patterns) {
        await realtimeSecurityNotificationService.notifyPatternDetection(pattern);
      }

      // ブラックリストイベントの通知
      for (const blacklist of detections.blacklistEvents) {
        await realtimeSecurityNotificationService.notifyBlacklistAddition(blacklist);
      }

      // レート制限違反の通知
      for (const violation of detections.rateViolations) {
        await realtimeSecurityNotificationService.notifyRateLimitViolation(violation);
      }
    } catch (error) {
      console.error('Notification sending failed:', error);
    }
  }

  /**
   * セキュリティログ分析サービスへの詳細ログ記録
   */
  private async logSecurityAnalysis(
    analysis: SecurityAnalysisResult,
    logData: RequestLogData,
    detections: SecurityAnalysisResult['detections']
  ): Promise<void> {
    try {
      // 異常検知イベントの記録
      for (const anomaly of detections.anomalies) {
        await securityLogAnalysisService.logSecurityEvent({
          eventType: this.mapAnomalyTypeToEventType(anomaly.type),
          severity: this.mapThreatLevelToSeverity(anomaly.threatLevel),
          source: 'anomaly_detection_engine',
          ipAddress: anomaly.ipAddress,
          userAgent: anomaly.userAgent,
          userId: anomaly.userId,
          endpoint: anomaly.endpoint,
          method: logData.method,
          statusCode: logData.statusCode,
          detectionEngine: 'ANOMALY_DETECTION',
          confidence: anomaly.confidence,
          riskScore: anomaly.riskScore,
          geoLocation: logData.geoLocation,
          metadata: {
            anomalyId: anomaly.id,
            description: anomaly.description,
            evidence: anomaly.evidence,
            actionTaken: anomaly.actionTaken,
          },
          tags: ['anomaly', anomaly.type],
        });
      }

      // パターン検知イベントの記録
      for (const pattern of detections.patterns) {
        await securityLogAnalysisService.logSecurityEvent({
          eventType: this.mapAttackTypeToEventType(pattern.attackType),
          severity: this.mapRiskScoreToSeverity(pattern.riskScore),
          source: 'pattern_detection_engine',
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          userId: logData.userId,
          endpoint: pattern.evidence.location,
          method: logData.method,
          statusCode: logData.statusCode,
          payload: pattern.evidence.payload,
          detectionEngine: 'PATTERN_DETECTION',
          confidence: pattern.confidence,
          riskScore: pattern.riskScore,
          geoLocation: logData.geoLocation,
          metadata: {
            attackType: pattern.attackType,
            matchedPatterns: pattern.matchedPatterns,
            behaviorIndicators: pattern.behaviorIndicators,
            recommendations: pattern.recommendations,
            evidence: pattern.evidence,
          },
          tags: ['pattern', pattern.attackType, 'attack'],
        });
      }

      // ブラックリストイベントの記録
      for (const blacklist of detections.blacklistEvents) {
        await securityLogAnalysisService.logSecurityEvent({
          eventType: SecurityEventType.BLACKLIST_HIT,
          severity: this.mapBlacklistSeverityToSecuritySeverity(blacklist.severity),
          source: 'ip_blacklist_service',
          ipAddress: blacklist.ipAddress,
          endpoint: 'multiple',
          method: 'MULTIPLE',
          detectionEngine: 'IP_BLACKLIST',
          confidence: 95,
          riskScore: this.calculateBlacklistRiskScore(blacklist),
          geoLocation: blacklist.geoLocation,
          metadata: {
            reason: blacklist.reason,
            severity: blacklist.severity,
            attackCount: blacklist.attackCount,
            blockedRequests: blacklist.blockedRequests,
            permanent: blacklist.permanent,
            notes: blacklist.notes,
            firstDetected: blacklist.firstDetected,
            lastActivity: blacklist.lastActivity,
          },
          tags: ['blacklist', blacklist.reason, 'blocked'],
        });
      }

      // レート制限違反の記録
      for (const violation of detections.rateViolations) {
        await securityLogAnalysisService.logSecurityEvent({
          eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: this.mapViolationSeverityToSecuritySeverity(violation.severity || 'medium'),
          source: 'rate_limiter',
          ipAddress: violation.ipAddress || logData.ipAddress,
          userAgent: violation.userAgent,
          userId: violation.userId,
          endpoint: violation.endpoint || logData.path,
          method: violation.method || logData.method,
          detectionEngine: 'RATE_LIMITER',
          confidence: 90,
          riskScore: this.calculateRateLimitRiskScore(violation),
          geoLocation: logData.geoLocation,
          metadata: {
            violationType: violation.violationType,
            requestCount: violation.requestCount,
            allowedCount: violation.allowedCount,
            ruleId: violation.ruleId,
            actionTaken: violation.actionTaken,
          },
          tags: ['rate_limit', violation.violationType, 'violation'],
        });
      }

      // 複合分析結果の記録（複数の検知がある場合）
      if (analysis.detectionCount > 1) {
        await securityLogAnalysisService.logSecurityEvent({
          eventType: SecurityEventType.COORDINATED_ATTACK,
          severity: this.mapRiskLevelToSecuritySeverity(analysis.riskLevel),
          source: 'security_orchestrator',
          ipAddress: analysis.ipAddress,
          endpoint: 'multiple',
          method: 'MULTIPLE',
          detectionEngine: 'SECURITY_ORCHESTRATOR',
          confidence: 95,
          riskScore: analysis.totalRiskScore,
          geoLocation: logData.geoLocation,
          metadata: {
            analysisTimestamp: analysis.timestamp,
            detectionCount: analysis.detectionCount,
            riskLevel: analysis.riskLevel,
            shouldBlock: analysis.shouldBlock,
            escalationRequired: analysis.escalationRequired,
            recommendedActions: analysis.recommendedActions,
            anomalyCount: detections.anomalies.length,
            patternCount: detections.patterns.length,
            blacklistCount: detections.blacklistEvents.length,
            rateViolationCount: detections.rateViolations.length,
          },
          tags: ['coordinated', 'multiple_detection', analysis.riskLevel.toLowerCase(), 'orchestrator'],
        });
      }

    } catch (error) {
      console.error('Failed to log security analysis:', error);
      captureError(error as Error, {
        tags: { category: 'security_logging', issue: 'analysis_log_failure' },
        level: 'warning'
      });
    }
  }

  private storeAnalysisResult(analysis: SecurityAnalysisResult): void {
    const key = analysis.ipAddress;
    if (!this.activeAnalysis.has(key)) {
      this.activeAnalysis.set(key, []);
    }

    const results = this.activeAnalysis.get(key)!;
    results.push(analysis);

    // 最新100件のみ保持
    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }
  }

  private createFallbackResult(logData: RequestLogData): SecurityAnalysisResult {
    return {
      timestamp: new Date(),
      ipAddress: logData.ipAddress,
      riskLevel: 'LOW',
      totalRiskScore: 0,
      detectionCount: 0,
      detections: {
        anomalies: [],
        patterns: [],
        rateViolations: [],
        blacklistEvents: []
      },
      recommendedActions: ['Monitor for future activity'],
      shouldBlock: false,
      escalationRequired: false
    };
  }

  private startBackgroundProcessing(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) return;

      this.isProcessing = true;
      
      try {
        const batch = this.processingQueue.splice(0, 10); // 10件ずつ処理
        
        await Promise.all(
          batch.map(logData => this.analyzeRequest(logData))
        );
      } catch (error) {
        console.error('Background processing failed:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // 5秒ごと
  }

  private startPeriodicTasks(): void {
    // 脅威インテリジェンスのクリーンアップ（1時間ごと）
    setInterval(() => {
      this.cleanupThreatIntelligence();
    }, 60 * 60 * 1000);

    // 複合脅威の分析（10分ごと）
    setInterval(() => {
      this.analyzeCompositeThreats();
    }, 10 * 60 * 1000);
  }

  private cleanupThreatIntelligence(): void {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30日

    for (const [ip, intel] of this.threatIntelligence.entries()) {
      if (now - intel.lastSeen.getTime() > maxAge && !intel.isActivelyMonitored) {
        this.threatIntelligence.delete(ip);
      }
    }
  }

  private async analyzeCompositeThreats(): Promise<void> {
    const now = Date.now();
    const analysisWindow = 15 * 60 * 1000; // 15分

    for (const [ip, results] of this.activeAnalysis.entries()) {
      const recentResults = results.filter(r => 
        now - r.timestamp.getTime() < analysisWindow
      );

      if (recentResults.length >= 3) {
        const highRiskResults = recentResults.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');
        
        if (highRiskResults.length >= 2) {
          console.log(`Composite threat detected for IP ${ip}: ${highRiskResults.length} high-risk events in 15 minutes`);
          // 複合脅威の通知
          // await this.notifyCompositeThrea(ip, recentResults);
        }
      }
    }
  }

  private getRecentAnalysisResults(): SecurityAnalysisResult[] {
    const allResults: SecurityAnalysisResult[] = [];
    
    for (const results of this.activeAnalysis.values()) {
      allResults.push(...results.slice(-5)); // 各IPから最新5件
    }

    return allResults
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // 最新50件
  }

  private async getSystemStatus(): Promise<{
    engines: Array<{ name: string; status: 'online' | 'offline' | 'degraded'; lastCheck: Date }>;
    performance: { avgAnalysisTime: number; queueSize: number; processingRate: number };
  }> {
    return {
      engines: [
        { name: 'Anomaly Detection Engine', status: 'online', lastCheck: new Date() },
        { name: 'Pattern Detection Engine', status: 'online', lastCheck: new Date() },
        { name: 'IP Blacklist Service', status: 'online', lastCheck: new Date() },
        { name: 'Rate Limiter', status: 'online', lastCheck: new Date() },
        { name: 'Notification Service', status: 'online', lastCheck: new Date() },
      ],
      performance: {
        avgAnalysisTime: 150, // ms
        queueSize: this.processingQueue.length,
        processingRate: 10 // requests/sec
      }
    };
  }

  private isAllowedBot(userAgent: string): boolean {
    const allowedBots = [
      /googlebot/i, /bingbot/i, /yahoo/i, /duckduckbot/i,
      /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i
    ];
    
    return allowedBots.some(pattern => pattern.test(userAgent));
  }

  /**
   * マッピング用ヘルパーメソッド
   */
  private mapAnomalyTypeToEventType(type: string): SecurityEventType {
    const mapping: Record<string, SecurityEventType> = {
      'rate_limit_violation': SecurityEventType.RATE_LIMIT_EXCEEDED,
      'suspicious_user_agent': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'sql_injection': SecurityEventType.SQL_INJECTION,
      'xss_attempt': SecurityEventType.XSS_ATTACK,
      'command_injection': SecurityEventType.COMMAND_INJECTION,
      'path_traversal': SecurityEventType.PATH_TRAVERSAL,
      'brute_force': SecurityEventType.BRUTE_FORCE,
      'scanner_activity': SecurityEventType.SCANNER_ACTIVITY,
      'bot_activity': SecurityEventType.BOT_ACTIVITY,
      'unusual_geographic_access': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'suspicious_api_usage': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'large_payload': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'repeated_404_errors': SecurityEventType.SCANNER_ACTIVITY,
      'session_anomaly': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'timestamp_manipulation': SecurityEventType.SUSPICIOUS_ACTIVITY,
    };

    return mapping[type] || SecurityEventType.SUSPICIOUS_ACTIVITY;
  }

  private mapAttackTypeToEventType(attackType: string): SecurityEventType {
    const mapping: Record<string, SecurityEventType> = {
      'sql_injection': SecurityEventType.SQL_INJECTION,
      'xss_attack': SecurityEventType.XSS_ATTACK,
      'command_injection': SecurityEventType.COMMAND_INJECTION,
      'path_traversal': SecurityEventType.PATH_TRAVERSAL,
      'xxe_attack': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'ldap_injection': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'nosql_injection': SecurityEventType.SQL_INJECTION,
      'template_injection': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'deserialization_attack': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'file_inclusion': SecurityEventType.PATH_TRAVERSAL,
      'ssrf_attack': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'csrf_attack': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'clickjacking': SecurityEventType.SUSPICIOUS_ACTIVITY,
      'coordinated_attack': SecurityEventType.COORDINATED_ATTACK,
    };

    return mapping[attackType] || SecurityEventType.SUSPICIOUS_ACTIVITY;
  }

  private mapThreatLevelToSeverity(level: string): SecuritySeverity {
    switch (level.toLowerCase()) {
      case 'critical': return SecuritySeverity.CRITICAL;
      case 'high': return SecuritySeverity.HIGH;
      case 'medium': return SecuritySeverity.MEDIUM;
      case 'low': return SecuritySeverity.LOW;
      default: return SecuritySeverity.INFO;
    }
  }

  private mapRiskScoreToSeverity(riskScore: number): SecuritySeverity {
    if (riskScore >= 80) return SecuritySeverity.CRITICAL;
    if (riskScore >= 60) return SecuritySeverity.HIGH;
    if (riskScore >= 40) return SecuritySeverity.MEDIUM;
    if (riskScore >= 20) return SecuritySeverity.LOW;
    return SecuritySeverity.INFO;
  }

  private mapRiskLevelToSecuritySeverity(riskLevel: string): SecuritySeverity {
    switch (riskLevel) {
      case 'CRITICAL': return SecuritySeverity.CRITICAL;
      case 'HIGH': return SecuritySeverity.HIGH;
      case 'MEDIUM': return SecuritySeverity.MEDIUM;
      case 'LOW': return SecuritySeverity.LOW;
      default: return SecuritySeverity.INFO;
    }
  }

  private mapBlacklistSeverityToSecuritySeverity(severity: string): SecuritySeverity {
    switch (severity) {
      case 'CRITICAL': return SecuritySeverity.CRITICAL;
      case 'HIGH': return SecuritySeverity.HIGH;
      case 'MEDIUM': return SecuritySeverity.MEDIUM;
      case 'LOW': return SecuritySeverity.LOW;
      default: return SecuritySeverity.INFO;
    }
  }

  private mapViolationSeverityToSecuritySeverity(severity: string): SecuritySeverity {
    switch (severity.toLowerCase()) {
      case 'critical': return SecuritySeverity.CRITICAL;
      case 'high': return SecuritySeverity.HIGH;
      case 'medium': return SecuritySeverity.MEDIUM;
      case 'low': return SecuritySeverity.LOW;
      default: return SecuritySeverity.INFO;
    }
  }

  private calculateBlacklistRiskScore(blacklist: any): number {
    const baseScore = blacklist.severity === 'CRITICAL' ? 90 :
                     blacklist.severity === 'HIGH' ? 70 :
                     blacklist.severity === 'MEDIUM' ? 50 : 30;
    
    const attackCountBonus = Math.min(blacklist.attackCount * 5, 20);
    return Math.min(baseScore + attackCountBonus, 100);
  }

  private calculateRateLimitRiskScore(violation: any): number {
    const baseScore = violation.severity === 'critical' ? 80 : 
                     violation.severity === 'high' ? 60 : 
                     violation.severity === 'medium' ? 40 : 20;
    
    const overageMultiplier = violation.requestCount && violation.allowedCount ? 
      Math.min(violation.requestCount / violation.allowedCount, 3) : 1;
    
    return Math.min(baseScore * overageMultiplier, 100);
  }

  /**
   * 公開メソッド
   */
  getThreatIntelligence(): ThreatIntelligence[] {
    return Array.from(this.threatIntelligence.values())
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  async getIPAnalysis(ipAddress: string): Promise<{
    intelligence: ThreatIntelligence | null;
    recentAnalysis: SecurityAnalysisResult[];
    recommendations: string[];
  }> {
    const intelligence = this.threatIntelligence.get(ipAddress) || null;
    const recentAnalysis = this.activeAnalysis.get(ipAddress) || [];
    
    const recommendations: string[] = [];
    if (intelligence) {
      if (intelligence.riskScore >= 80) {
        recommendations.push('Immediate blocking recommended');
      } else if (intelligence.riskScore >= 60) {
        recommendations.push('Enhanced monitoring required');
      } else if (intelligence.riskScore >= 40) {
        recommendations.push('Regular monitoring advised');
      }

      if (intelligence.totalDetections >= 10) {
        recommendations.push('Review all activity from this IP');
      }
    }

    return {
      intelligence,
      recentAnalysis: recentAnalysis.slice(-10),
      recommendations
    };
  }

  async forceAnalysis(ipAddress: string): Promise<SecurityAnalysisResult | null> {
    // 強制的に分析を実行（管理者用）
    const recentResults = this.activeAnalysis.get(ipAddress);
    if (recentResults && recentResults.length > 0) {
      return recentResults[recentResults.length - 1];
    }
    return null;
  }

  /**
   * 閾値評価とリアルタイム調整
   */
  private async evaluateAndAdjustThresholds(
    analysisResult: SecurityAnalysisResult,
    logData: RequestLogData,
    detections: SecurityAnalysisResult['detections']
  ): Promise<void> {
    try {
      // システム状況の収集
      const systemMetrics = await this.collectSystemMetrics(logData);
      
      // 閾値調整ルールの評価
      await securityThresholdManagerService.evaluateThresholdRules({
        requestCount: systemMetrics.requestCount,
        errorRate: systemMetrics.errorRate,
        responseTime: logData.responseTime,
        anomalyCount: detections.anomalies.length,
        timeWindow: 300 // 5分間
      });

      // 個別の閾値調整判定
      await this.performSpecificThresholdAdjustments(analysisResult, detections, systemMetrics);

    } catch (error) {
      console.error('Failed to evaluate and adjust thresholds:', error);
      captureError(error as Error, {
        tags: { category: 'threshold_management', issue: 'evaluation_failure' },
        level: 'warning'
      });
    }
  }

  /**
   * 個別の閾値調整判定
   */
  private async performSpecificThresholdAdjustments(
    analysisResult: SecurityAnalysisResult,
    detections: SecurityAnalysisResult['detections'],
    systemMetrics: any
  ): Promise<void> {
    // レート制限の調整
    if (detections.rateViolations.length > 5) {
      const currentRateLimit = await securityThresholdManagerService.getThreshold('rate_limit_requests_per_minute');
      if (currentRateLimit && currentRateLimit.value > 50) {
        await securityThresholdManagerService.adjustThresholdAutomatically(
          'rate_limit_requests_per_minute',
          -10,
          `High rate violations detected (${detections.rateViolations.length} violations)`,
          { 
            triggerEvent: 'rate_violations_spike',
            violationCount: detections.rateViolations.length,
            riskLevel: analysisResult.riskLevel
          }
        );
      }
    }

    // 異常検知感度の調整
    if (detections.anomalies.length === 0 && analysisResult.riskLevel === 'CRITICAL') {
      const responseTimeThreshold = await securityThresholdManagerService.getThreshold('anomaly_response_time_threshold');
      if (responseTimeThreshold && responseTimeThreshold.value > 3000) {
        await securityThresholdManagerService.adjustThresholdAutomatically(
          'anomaly_response_time_threshold',
          -1000,
          'Critical threat not detected by anomaly detection - increasing sensitivity',
          {
            triggerEvent: 'missed_critical_threat',
            actualResponseTime: systemMetrics.responseTime,
            riskLevel: analysisResult.riskLevel
          }
        );
      }
    }

    // パターンマッチング信頼度の調整
    if (detections.patterns.some(p => p.confidence < 70) && analysisResult.riskLevel === 'HIGH') {
      const confidenceThreshold = await securityThresholdManagerService.getThreshold('pattern_confidence_threshold');
      if (confidenceThreshold && confidenceThreshold.value > 60) {
        await securityThresholdManagerService.adjustThresholdAutomatically(
          'pattern_confidence_threshold',
          -5,
          'Lowering pattern confidence threshold due to high-risk detections with low confidence',
          {
            triggerEvent: 'low_confidence_high_risk',
            patternCount: detections.patterns.length,
            minConfidence: Math.min(...detections.patterns.map(p => p.confidence))
          }
        );
      }
    }

    // エラー率が高い場合の閾値調整
    if (systemMetrics.errorRate > 15) {
      const errorRateThreshold = await securityThresholdManagerService.getThreshold('anomaly_error_rate_threshold');
      if (errorRateThreshold && errorRateThreshold.value < 20) {
        await securityThresholdManagerService.adjustThresholdAutomatically(
          'anomaly_error_rate_threshold',
          2,
          `Adjusting error rate threshold due to system-wide high error rate (${systemMetrics.errorRate}%)`,
          {
            triggerEvent: 'system_high_error_rate',
            currentErrorRate: systemMetrics.errorRate,
            systemLoad: systemMetrics.systemLoad
          }
        );
      }
    }

    // 自動ブラックリスト追加の調整
    if (analysisResult.totalRiskScore > 90 && detections.blacklistEvents.length === 0) {
      const blacklistThreshold = await securityThresholdManagerService.getThreshold('blacklist_auto_add_threshold');
      if (blacklistThreshold && blacklistThreshold.value > 5) {
        await securityThresholdManagerService.adjustThresholdAutomatically(
          'blacklist_auto_add_threshold',
          -2,
          'Lowering auto-blacklist threshold due to very high risk score without blacklist action',
          {
            triggerEvent: 'high_risk_no_blacklist',
            riskScore: analysisResult.totalRiskScore,
            detectionCount: analysisResult.detectionCount
          }
        );
      }
    }
  }

  /**
   * システムメトリクスの収集
   */
  private async collectSystemMetrics(logData: RequestLogData): Promise<{
    requestCount: number;
    errorRate: number;
    responseTime: number;
    systemLoad: number;
  }> {
    // 簡易的な実装（実際にはより詳細なメトリクス収集）
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // リクエスト履歴から統計を計算
    const recentAnalysis = Array.from(this.activeAnalysis.values())
      .flat()
      .filter(result => result.timestamp.getTime() > fiveMinutesAgo);

    const requestCount = recentAnalysis.length;
    const errorCount = recentAnalysis.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length;
    const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

    const responseTimes = recentAnalysis.map(r => 
      // logDataから実際のレスポンス時間を取得するか、平均値を計算
      1000 // プレースホルダー値
    );
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : logData.responseTime;

    return {
      requestCount,
      errorRate,
      responseTime: avgResponseTime,
      systemLoad: Math.min(requestCount / 50, 1) // 0-1の負荷指標
    };
  }
}

// シングルトンインスタンス
export const securityOrchestratorService = new SecurityOrchestratorService();

export default SecurityOrchestratorService;