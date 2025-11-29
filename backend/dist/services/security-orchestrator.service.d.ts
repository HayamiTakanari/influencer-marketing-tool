import { RequestLogData } from '../middleware/request-logger';
import { AnomalyDetection } from './anomaly-detection.service';
import { DetectionResult } from './pattern-detection.service';
import { BlacklistEntry } from './ip-blacklist.service';
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
declare class SecurityOrchestratorService {
    private threatIntelligence;
    private activeAnalysis;
    private processingQueue;
    private isProcessing;
    constructor();
    /**
     * メインのセキュリティ分析エントリーポイント
     */
    analyzeRequest(logData: RequestLogData): Promise<SecurityAnalysisResult>;
    /**
     * バッチ処理でリクエストを分析
     */
    queueRequestForAnalysis(logData: RequestLogData): Promise<void>;
    /**
     * 脅威インテリジェンスレポートの生成
     */
    generateThreatIntelligenceReport(): Promise<{
        summary: {
            totalThreats: number;
            activeThreats: number;
            highRiskIPs: number;
            newThreatsToday: number;
        };
        topThreats: ThreatIntelligence[];
        riskDistribution: Record<string, number>;
        geographicalDistribution: Array<{
            country: string;
            count: number;
            avgRisk: number;
        }>;
        attackTrends: Array<{
            date: string;
            count: number;
            avgRisk: number;
        }>;
    }>;
    /**
     * セキュリティダッシュボードデータの取得
     */
    getSecurityDashboard(): Promise<any>;
    /**
     * プライベートメソッド
     */
    private runAnomalyDetection;
    private runPatternDetection;
    private checkBlacklist;
    private getRateViolations;
    private calculateRiskAnalysis;
    private generateRecommendedActions;
    private updateThreatIntelligence;
    private executeAutomatedResponse;
    private executeAutoBlock;
    private adjustRateLimits;
    private addToBlacklist;
    private sendNotifications;
    /**
     * セキュリティログ分析サービスへの詳細ログ記録
     */
    private logSecurityAnalysis;
    private storeAnalysisResult;
    private createFallbackResult;
    private startBackgroundProcessing;
    private startPeriodicTasks;
    private cleanupThreatIntelligence;
    private analyzeCompositeThreats;
    private getRecentAnalysisResults;
    private getSystemStatus;
    private isAllowedBot;
    /**
     * マッピング用ヘルパーメソッド
     */
    private mapAnomalyTypeToEventType;
    private mapAttackTypeToEventType;
    private mapThreatLevelToSeverity;
    private mapRiskScoreToSeverity;
    private mapRiskLevelToSecuritySeverity;
    private mapBlacklistSeverityToSecuritySeverity;
    private mapViolationSeverityToSecuritySeverity;
    private calculateBlacklistRiskScore;
    private calculateRateLimitRiskScore;
    /**
     * 公開メソッド
     */
    getThreatIntelligence(): ThreatIntelligence[];
    getIPAnalysis(ipAddress: string): Promise<{
        intelligence: ThreatIntelligence | null;
        recentAnalysis: SecurityAnalysisResult[];
        recommendations: string[];
    }>;
    forceAnalysis(ipAddress: string): Promise<SecurityAnalysisResult | null>;
    /**
     * 閾値評価とリアルタイム調整
     */
    private evaluateAndAdjustThresholds;
    /**
     * 個別の閾値調整判定
     */
    private performSpecificThresholdAdjustments;
    /**
     * システムメトリクスの収集
     */
    private collectSystemMetrics;
}
export declare const securityOrchestratorService: SecurityOrchestratorService;
export default SecurityOrchestratorService;
//# sourceMappingURL=security-orchestrator.service.d.ts.map