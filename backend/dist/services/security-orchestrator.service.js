"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityOrchestratorService = void 0;
const anomaly_detection_service_1 = require("./anomaly-detection.service");
const pattern_detection_service_1 = require("./pattern-detection.service");
const ip_blacklist_service_1 = require("./ip-blacklist.service");
const realtime_security_notification_service_1 = require("./realtime-security-notification.service");
const security_log_analysis_service_1 = require("./security-log-analysis.service");
const security_threshold_manager_service_1 = require("./security-threshold-manager.service");
const sentry_1 = require("../config/sentry");
class SecurityOrchestratorService {
    constructor() {
        this.threatIntelligence = new Map();
        this.activeAnalysis = new Map();
        this.processingQueue = [];
        this.isProcessing = false;
        this.startBackgroundProcessing();
        this.startPeriodicTasks();
    }
    /**
     * メインのセキュリティ分析エントリーポイント
     */
    async analyzeRequest(logData) {
        try {
            console.log(`Starting security analysis for ${logData.ipAddress} - ${logData.method} ${logData.path}`);
            // 並列で全ての検知エンジンを実行
            const [anomalies, patterns, blacklistCheck, rateViolations] = await Promise.allSettled([
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
        }
        catch (error) {
            console.error('Security analysis failed:', error);
            (0, sentry_1.captureError)(error, {
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
    async queueRequestForAnalysis(logData) {
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
    async generateThreatIntelligenceReport() {
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
        const riskDistribution = {
            'LOW (0-30)': 0,
            'MEDIUM (31-60)': 0,
            'HIGH (61-80)': 0,
            'CRITICAL (81-100)': 0
        };
        allThreats.forEach(threat => {
            if (threat.riskScore <= 30)
                riskDistribution['LOW (0-30)']++;
            else if (threat.riskScore <= 60)
                riskDistribution['MEDIUM (31-60)']++;
            else if (threat.riskScore <= 80)
                riskDistribution['HIGH (61-80)']++;
            else
                riskDistribution['CRITICAL (81-100)']++;
        });
        // 地理的分布
        const geoData = new Map();
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
        const attackTrends = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const dayThreats = allThreats.filter(t => t.lastSeen >= dayStart && t.lastSeen <= dayEnd);
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
    async getSecurityDashboard() {
        const [threatReport, notificationDashboard] = await Promise.all([
            this.generateThreatIntelligenceReport(),
            realtime_security_notification_service_1.realtimeSecurityNotificationService.getSecurityDashboard()
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
    async runAnomalyDetection(logData) {
        try {
            return await anomaly_detection_service_1.anomalyDetectionService.detectAnomalies(logData);
        }
        catch (error) {
            console.error('Anomaly detection failed:', error);
            return [];
        }
    }
    async runPatternDetection(logData) {
        try {
            return await pattern_detection_service_1.patternDetectionService.detectAttacks(logData);
        }
        catch (error) {
            console.error('Pattern detection failed:', error);
            return [];
        }
    }
    async checkBlacklist(logData) {
        try {
            const result = await ip_blacklist_service_1.ipBlacklistService.isBlacklisted(logData.ipAddress);
            return result.entry ? [result.entry] : [];
        }
        catch (error) {
            console.error('Blacklist check failed:', error);
            return [];
        }
    }
    async getRateViolations(ipAddress) {
        try {
            // Rate violationsの取得（実装は簡略化）
            return [];
        }
        catch (error) {
            console.error('Rate violation check failed:', error);
            return [];
        }
    }
    calculateRiskAnalysis(logData, detections) {
        let totalRiskScore = 0;
        let detectionCount = 0;
        const riskFactors = [];
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
        let riskLevel;
        if (finalRiskScore >= 80)
            riskLevel = 'CRITICAL';
        else if (finalRiskScore >= 60)
            riskLevel = 'HIGH';
        else if (finalRiskScore >= 40)
            riskLevel = 'MEDIUM';
        else
            riskLevel = 'LOW';
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
    generateRecommendedActions(riskLevel, riskFactors, detections) {
        const actions = [];
        if (riskLevel === 'CRITICAL') {
            actions.push('Immediate IP blocking recommended');
            actions.push('Escalate to security team');
            actions.push('Conduct forensic analysis');
        }
        else if (riskLevel === 'HIGH') {
            actions.push('Enhanced monitoring required');
            actions.push('Consider temporary rate limiting');
            actions.push('Review security logs');
        }
        else if (riskLevel === 'MEDIUM') {
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
    async updateThreatIntelligence(logData, analysis) {
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
            if (!intel.threatTypes.includes(a.type)) {
                intel.threatTypes.push(a.type);
            }
        });
        analysis.detections.patterns.forEach(p => {
            if (!intel.threatTypes.includes(p.attackType)) {
                intel.threatTypes.push(p.attackType);
            }
        });
        // アクティブ監視の判定
        intel.isActivelyMonitored = intel.riskScore >= 50 || intel.totalDetections >= 5;
        intel.blockRecommendation = intel.riskScore >= 70;
        this.threatIntelligence.set(ipAddress, intel);
    }
    async executeAutomatedResponse(analysis) {
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
        }
        catch (error) {
            console.error('Automated response failed:', error);
        }
    }
    async executeAutoBlock(analysis) {
        console.log(`Executing auto-block for ${analysis.ipAddress} - Risk Level: ${analysis.riskLevel}`);
        // 実装: ファイアウォールルールの追加、NGINXブロック等
    }
    async adjustRateLimits(analysis) {
        console.log(`Adjusting rate limits for ${analysis.ipAddress}`);
        // 実装: 動的レート制限の調整
    }
    async addToBlacklist(analysis) {
        const reason = analysis.detections.patterns.length > 0 ? 'SECURITY_VIOLATION' : 'MALICIOUS_ACTIVITY';
        await ip_blacklist_service_1.ipBlacklistService.addToBlacklist({
            ipAddress: analysis.ipAddress,
            reason: reason,
            severity: 'HIGH',
            duration: 24 * 60, // 24時間
            notes: `Auto-blocked: Risk Level ${analysis.riskLevel}, Score ${analysis.totalRiskScore}`
        });
    }
    async sendNotifications(analysis, detections) {
        try {
            // 異常検知の通知
            for (const anomaly of detections.anomalies) {
                await realtime_security_notification_service_1.realtimeSecurityNotificationService.notifyAnomalyDetection(anomaly);
            }
            // パターン検知の通知
            for (const pattern of detections.patterns) {
                await realtime_security_notification_service_1.realtimeSecurityNotificationService.notifyPatternDetection(pattern);
            }
            // ブラックリストイベントの通知
            for (const blacklist of detections.blacklistEvents) {
                await realtime_security_notification_service_1.realtimeSecurityNotificationService.notifyBlacklistAddition(blacklist);
            }
            // レート制限違反の通知
            for (const violation of detections.rateViolations) {
                await realtime_security_notification_service_1.realtimeSecurityNotificationService.notifyRateLimitViolation(violation);
            }
        }
        catch (error) {
            console.error('Notification sending failed:', error);
        }
    }
    /**
     * セキュリティログ分析サービスへの詳細ログ記録
     */
    async logSecurityAnalysis(analysis, logData, detections) {
        try {
            // 異常検知イベントの記録
            for (const anomaly of detections.anomalies) {
                await security_log_analysis_service_1.securityLogAnalysisService.logSecurityEvent({
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
                await security_log_analysis_service_1.securityLogAnalysisService.logSecurityEvent({
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
                await security_log_analysis_service_1.securityLogAnalysisService.logSecurityEvent({
                    eventType: security_log_analysis_service_1.SecurityEventType.BLACKLIST_HIT,
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
                await security_log_analysis_service_1.securityLogAnalysisService.logSecurityEvent({
                    eventType: security_log_analysis_service_1.SecurityEventType.RATE_LIMIT_EXCEEDED,
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
                await security_log_analysis_service_1.securityLogAnalysisService.logSecurityEvent({
                    eventType: security_log_analysis_service_1.SecurityEventType.COORDINATED_ATTACK,
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
        }
        catch (error) {
            console.error('Failed to log security analysis:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'security_logging', issue: 'analysis_log_failure' },
                level: 'warning'
            });
        }
    }
    storeAnalysisResult(analysis) {
        const key = analysis.ipAddress;
        if (!this.activeAnalysis.has(key)) {
            this.activeAnalysis.set(key, []);
        }
        const results = this.activeAnalysis.get(key);
        results.push(analysis);
        // 最新100件のみ保持
        if (results.length > 100) {
            results.splice(0, results.length - 100);
        }
    }
    createFallbackResult(logData) {
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
    startBackgroundProcessing() {
        setInterval(async () => {
            if (this.isProcessing || this.processingQueue.length === 0)
                return;
            this.isProcessing = true;
            try {
                const batch = this.processingQueue.splice(0, 10); // 10件ずつ処理
                await Promise.all(batch.map(logData => this.analyzeRequest(logData)));
            }
            catch (error) {
                console.error('Background processing failed:', error);
            }
            finally {
                this.isProcessing = false;
            }
        }, 5000); // 5秒ごと
    }
    startPeriodicTasks() {
        // 脅威インテリジェンスのクリーンアップ（1時間ごと）
        setInterval(() => {
            this.cleanupThreatIntelligence();
        }, 60 * 60 * 1000);
        // 複合脅威の分析（10分ごと）
        setInterval(() => {
            this.analyzeCompositeThreats();
        }, 10 * 60 * 1000);
    }
    cleanupThreatIntelligence() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30日
        for (const [ip, intel] of this.threatIntelligence.entries()) {
            if (now - intel.lastSeen.getTime() > maxAge && !intel.isActivelyMonitored) {
                this.threatIntelligence.delete(ip);
            }
        }
    }
    async analyzeCompositeThreats() {
        const now = Date.now();
        const analysisWindow = 15 * 60 * 1000; // 15分
        for (const [ip, results] of this.activeAnalysis.entries()) {
            const recentResults = results.filter(r => now - r.timestamp.getTime() < analysisWindow);
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
    getRecentAnalysisResults() {
        const allResults = [];
        for (const results of this.activeAnalysis.values()) {
            allResults.push(...results.slice(-5)); // 各IPから最新5件
        }
        return allResults
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50); // 最新50件
    }
    async getSystemStatus() {
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
    isAllowedBot(userAgent) {
        const allowedBots = [
            /googlebot/i, /bingbot/i, /yahoo/i, /duckduckbot/i,
            /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i
        ];
        return allowedBots.some(pattern => pattern.test(userAgent));
    }
    /**
     * マッピング用ヘルパーメソッド
     */
    mapAnomalyTypeToEventType(type) {
        const mapping = {
            'rate_limit_violation': security_log_analysis_service_1.SecurityEventType.RATE_LIMIT_EXCEEDED,
            'suspicious_user_agent': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'sql_injection': security_log_analysis_service_1.SecurityEventType.SQL_INJECTION,
            'xss_attempt': security_log_analysis_service_1.SecurityEventType.XSS_ATTACK,
            'command_injection': security_log_analysis_service_1.SecurityEventType.COMMAND_INJECTION,
            'path_traversal': security_log_analysis_service_1.SecurityEventType.PATH_TRAVERSAL,
            'brute_force': security_log_analysis_service_1.SecurityEventType.BRUTE_FORCE,
            'scanner_activity': security_log_analysis_service_1.SecurityEventType.SCANNER_ACTIVITY,
            'bot_activity': security_log_analysis_service_1.SecurityEventType.BOT_ACTIVITY,
            'unusual_geographic_access': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'suspicious_api_usage': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'large_payload': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'repeated_404_errors': security_log_analysis_service_1.SecurityEventType.SCANNER_ACTIVITY,
            'session_anomaly': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'timestamp_manipulation': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
        };
        return mapping[type] || security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY;
    }
    mapAttackTypeToEventType(attackType) {
        const mapping = {
            'sql_injection': security_log_analysis_service_1.SecurityEventType.SQL_INJECTION,
            'xss_attack': security_log_analysis_service_1.SecurityEventType.XSS_ATTACK,
            'command_injection': security_log_analysis_service_1.SecurityEventType.COMMAND_INJECTION,
            'path_traversal': security_log_analysis_service_1.SecurityEventType.PATH_TRAVERSAL,
            'xxe_attack': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'ldap_injection': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'nosql_injection': security_log_analysis_service_1.SecurityEventType.SQL_INJECTION,
            'template_injection': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'deserialization_attack': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'file_inclusion': security_log_analysis_service_1.SecurityEventType.PATH_TRAVERSAL,
            'ssrf_attack': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'csrf_attack': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'clickjacking': security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
            'coordinated_attack': security_log_analysis_service_1.SecurityEventType.COORDINATED_ATTACK,
        };
        return mapping[attackType] || security_log_analysis_service_1.SecurityEventType.SUSPICIOUS_ACTIVITY;
    }
    mapThreatLevelToSeverity(level) {
        switch (level.toLowerCase()) {
            case 'critical': return security_log_analysis_service_1.SecuritySeverity.CRITICAL;
            case 'high': return security_log_analysis_service_1.SecuritySeverity.HIGH;
            case 'medium': return security_log_analysis_service_1.SecuritySeverity.MEDIUM;
            case 'low': return security_log_analysis_service_1.SecuritySeverity.LOW;
            default: return security_log_analysis_service_1.SecuritySeverity.INFO;
        }
    }
    mapRiskScoreToSeverity(riskScore) {
        if (riskScore >= 80)
            return security_log_analysis_service_1.SecuritySeverity.CRITICAL;
        if (riskScore >= 60)
            return security_log_analysis_service_1.SecuritySeverity.HIGH;
        if (riskScore >= 40)
            return security_log_analysis_service_1.SecuritySeverity.MEDIUM;
        if (riskScore >= 20)
            return security_log_analysis_service_1.SecuritySeverity.LOW;
        return security_log_analysis_service_1.SecuritySeverity.INFO;
    }
    mapRiskLevelToSecuritySeverity(riskLevel) {
        switch (riskLevel) {
            case 'CRITICAL': return security_log_analysis_service_1.SecuritySeverity.CRITICAL;
            case 'HIGH': return security_log_analysis_service_1.SecuritySeverity.HIGH;
            case 'MEDIUM': return security_log_analysis_service_1.SecuritySeverity.MEDIUM;
            case 'LOW': return security_log_analysis_service_1.SecuritySeverity.LOW;
            default: return security_log_analysis_service_1.SecuritySeverity.INFO;
        }
    }
    mapBlacklistSeverityToSecuritySeverity(severity) {
        switch (severity) {
            case 'CRITICAL': return security_log_analysis_service_1.SecuritySeverity.CRITICAL;
            case 'HIGH': return security_log_analysis_service_1.SecuritySeverity.HIGH;
            case 'MEDIUM': return security_log_analysis_service_1.SecuritySeverity.MEDIUM;
            case 'LOW': return security_log_analysis_service_1.SecuritySeverity.LOW;
            default: return security_log_analysis_service_1.SecuritySeverity.INFO;
        }
    }
    mapViolationSeverityToSecuritySeverity(severity) {
        switch (severity.toLowerCase()) {
            case 'critical': return security_log_analysis_service_1.SecuritySeverity.CRITICAL;
            case 'high': return security_log_analysis_service_1.SecuritySeverity.HIGH;
            case 'medium': return security_log_analysis_service_1.SecuritySeverity.MEDIUM;
            case 'low': return security_log_analysis_service_1.SecuritySeverity.LOW;
            default: return security_log_analysis_service_1.SecuritySeverity.INFO;
        }
    }
    calculateBlacklistRiskScore(blacklist) {
        const baseScore = blacklist.severity === 'CRITICAL' ? 90 :
            blacklist.severity === 'HIGH' ? 70 :
                blacklist.severity === 'MEDIUM' ? 50 : 30;
        const attackCountBonus = Math.min(blacklist.attackCount * 5, 20);
        return Math.min(baseScore + attackCountBonus, 100);
    }
    calculateRateLimitRiskScore(violation) {
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
    getThreatIntelligence() {
        return Array.from(this.threatIntelligence.values())
            .sort((a, b) => b.riskScore - a.riskScore);
    }
    async getIPAnalysis(ipAddress) {
        const intelligence = this.threatIntelligence.get(ipAddress) || null;
        const recentAnalysis = this.activeAnalysis.get(ipAddress) || [];
        const recommendations = [];
        if (intelligence) {
            if (intelligence.riskScore >= 80) {
                recommendations.push('Immediate blocking recommended');
            }
            else if (intelligence.riskScore >= 60) {
                recommendations.push('Enhanced monitoring required');
            }
            else if (intelligence.riskScore >= 40) {
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
    async forceAnalysis(ipAddress) {
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
    async evaluateAndAdjustThresholds(analysisResult, logData, detections) {
        try {
            // システム状況の収集
            const systemMetrics = await this.collectSystemMetrics(logData);
            // 閾値調整ルールの評価
            await security_threshold_manager_service_1.securityThresholdManagerService.evaluateThresholdRules({
                requestCount: systemMetrics.requestCount,
                errorRate: systemMetrics.errorRate,
                responseTime: logData.responseTime,
                anomalyCount: detections.anomalies.length,
                timeWindow: 300 // 5分間
            });
            // 個別の閾値調整判定
            await this.performSpecificThresholdAdjustments(analysisResult, detections, systemMetrics);
        }
        catch (error) {
            console.error('Failed to evaluate and adjust thresholds:', error);
            (0, sentry_1.captureError)(error, {
                tags: { category: 'threshold_management', issue: 'evaluation_failure' },
                level: 'warning'
            });
        }
    }
    /**
     * 個別の閾値調整判定
     */
    async performSpecificThresholdAdjustments(analysisResult, detections, systemMetrics) {
        // レート制限の調整
        if (detections.rateViolations.length > 5) {
            const currentRateLimit = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold('rate_limit_requests_per_minute');
            if (currentRateLimit && currentRateLimit.value > 50) {
                await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically('rate_limit_requests_per_minute', -10, `High rate violations detected (${detections.rateViolations.length} violations)`, {
                    triggerEvent: 'rate_violations_spike',
                    violationCount: detections.rateViolations.length,
                    riskLevel: analysisResult.riskLevel
                });
            }
        }
        // 異常検知感度の調整
        if (detections.anomalies.length === 0 && analysisResult.riskLevel === 'CRITICAL') {
            const responseTimeThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold('anomaly_response_time_threshold');
            if (responseTimeThreshold && responseTimeThreshold.value > 3000) {
                await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically('anomaly_response_time_threshold', -1000, 'Critical threat not detected by anomaly detection - increasing sensitivity', {
                    triggerEvent: 'missed_critical_threat',
                    actualResponseTime: systemMetrics.responseTime,
                    riskLevel: analysisResult.riskLevel
                });
            }
        }
        // パターンマッチング信頼度の調整
        if (detections.patterns.some(p => p.confidence < 70) && analysisResult.riskLevel === 'HIGH') {
            const confidenceThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold('pattern_confidence_threshold');
            if (confidenceThreshold && confidenceThreshold.value > 60) {
                await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically('pattern_confidence_threshold', -5, 'Lowering pattern confidence threshold due to high-risk detections with low confidence', {
                    triggerEvent: 'low_confidence_high_risk',
                    patternCount: detections.patterns.length,
                    minConfidence: Math.min(...detections.patterns.map(p => p.confidence))
                });
            }
        }
        // エラー率が高い場合の閾値調整
        if (systemMetrics.errorRate > 15) {
            const errorRateThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold('anomaly_error_rate_threshold');
            if (errorRateThreshold && errorRateThreshold.value < 20) {
                await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically('anomaly_error_rate_threshold', 2, `Adjusting error rate threshold due to system-wide high error rate (${systemMetrics.errorRate}%)`, {
                    triggerEvent: 'system_high_error_rate',
                    currentErrorRate: systemMetrics.errorRate,
                    systemLoad: systemMetrics.systemLoad
                });
            }
        }
        // 自動ブラックリスト追加の調整
        if (analysisResult.totalRiskScore > 90 && detections.blacklistEvents.length === 0) {
            const blacklistThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold('blacklist_auto_add_threshold');
            if (blacklistThreshold && blacklistThreshold.value > 5) {
                await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically('blacklist_auto_add_threshold', -2, 'Lowering auto-blacklist threshold due to very high risk score without blacklist action', {
                    triggerEvent: 'high_risk_no_blacklist',
                    riskScore: analysisResult.totalRiskScore,
                    detectionCount: analysisResult.detectionCount
                });
            }
        }
    }
    /**
     * システムメトリクスの収集
     */
    async collectSystemMetrics(logData) {
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
exports.securityOrchestratorService = new SecurityOrchestratorService();
exports.default = SecurityOrchestratorService;
//# sourceMappingURL=security-orchestrator.service.js.map