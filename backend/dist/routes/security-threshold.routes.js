"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const security_threshold_manager_service_1 = require("../services/security-threshold-manager.service");
/**
 * セキュリティ閾値管理API
 * 動的な閾値調整と設定管理のエンドポイント
 */
const router = express_1.default.Router();
/**
 * 全閾値の取得
 */
router.get('/thresholds', async (req, res) => {
    try {
        const thresholds = await security_threshold_manager_service_1.securityThresholdManagerService.getAllThresholds();
        res.json({
            success: true,
            data: thresholds,
            total: thresholds.length
        });
    }
    catch (error) {
        console.error('Failed to get thresholds:', error);
        res.status(500).json({
            success: false,
            error: '閾値の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * カテゴリ別閾値の取得
 */
router.get('/thresholds/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['RATE_LIMIT', 'ANOMALY_DETECTION', 'PATTERN_MATCHING', 'RISK_SCORING', 'BLACKLIST'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: '無効なカテゴリです',
                validCategories
            });
        }
        const thresholds = await security_threshold_manager_service_1.securityThresholdManagerService.getThresholdsByCategory(category);
        res.json({
            success: true,
            data: thresholds,
            category,
            total: thresholds.length
        });
    }
    catch (error) {
        console.error('Failed to get thresholds by category:', error);
        res.status(500).json({
            success: false,
            error: 'カテゴリ別閾値の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 特定閾値の取得
 */
router.get('/thresholds/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const threshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold(id);
        if (!threshold) {
            return res.status(404).json({
                success: false,
                error: '指定された閾値が見つかりません',
                thresholdId: id
            });
        }
        res.json({
            success: true,
            data: threshold
        });
    }
    catch (error) {
        console.error('Failed to get threshold:', error);
        res.status(500).json({
            success: false,
            error: '閾値の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 閾値の更新
 */
router.put('/thresholds/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { value, reason } = req.body;
        const userId = req.user?.id || 'admin'; // 認証ミドルウェアから取得
        // 入力検証
        if (typeof value !== 'number' || value < 0) {
            return res.status(400).json({
                success: false,
                error: '閾値は0以上の数値である必要があります'
            });
        }
        if (!reason || typeof reason !== 'string') {
            return res.status(400).json({
                success: false,
                error: '変更理由は必須です'
            });
        }
        await security_threshold_manager_service_1.securityThresholdManagerService.updateThreshold(id, value, userId, reason);
        const updatedThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold(id);
        res.json({
            success: true,
            message: '閾値が正常に更新されました',
            data: updatedThreshold
        });
    }
    catch (error) {
        console.error('Failed to update threshold:', error);
        res.status(500).json({
            success: false,
            error: '閾値の更新に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 自動閾値調整の実行
 */
router.post('/thresholds/:id/adjust', async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, reason, metadata } = req.body;
        // 入力検証
        if (typeof adjustment !== 'number') {
            return res.status(400).json({
                success: false,
                error: '調整値は数値である必要があります'
            });
        }
        if (!reason || typeof reason !== 'string') {
            return res.status(400).json({
                success: false,
                error: '調整理由は必須です'
            });
        }
        await security_threshold_manager_service_1.securityThresholdManagerService.adjustThresholdAutomatically(id, adjustment, reason, metadata || {});
        const updatedThreshold = await security_threshold_manager_service_1.securityThresholdManagerService.getThreshold(id);
        res.json({
            success: true,
            message: '閾値が自動調整されました',
            data: updatedThreshold,
            adjustment,
            reason
        });
    }
    catch (error) {
        console.error('Failed to adjust threshold:', error);
        res.status(500).json({
            success: false,
            error: '閾値の自動調整に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 閾値統計の取得
 */
router.get('/statistics/thresholds', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // デフォルトで過去30日間
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                error: '無効な日付形式です'
            });
        }
        const statistics = await security_threshold_manager_service_1.securityThresholdManagerService.getThresholdStatistics({
            start,
            end
        });
        res.json({
            success: true,
            data: statistics,
            timeRange: {
                start: start.toISOString(),
                end: end.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Failed to get threshold statistics:', error);
        res.status(500).json({
            success: false,
            error: '閾値統計の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 閾値最適化提案の取得
 */
router.get('/suggestions', async (req, res) => {
    try {
        const suggestions = await security_threshold_manager_service_1.securityThresholdManagerService.suggestOptimizations();
        res.json({
            success: true,
            data: suggestions,
            total: suggestions.length,
            summary: {
                highConfidenceSuggestions: suggestions.filter(s => s.confidence >= 80).length,
                mediumConfidenceSuggestions: suggestions.filter(s => s.confidence >= 60 && s.confidence < 80).length,
                lowConfidenceSuggestions: suggestions.filter(s => s.confidence < 60).length
            }
        });
    }
    catch (error) {
        console.error('Failed to get optimization suggestions:', error);
        res.status(500).json({
            success: false,
            error: '最適化提案の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 設定の取得
 */
router.get('/configurations/:section', async (req, res) => {
    try {
        const { section } = req.params;
        const { key } = req.query;
        if (key) {
            const config = await security_threshold_manager_service_1.securityThresholdManagerService.getConfiguration(section, key);
            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: '指定された設定が見つかりません'
                });
            }
            return res.json({
                success: true,
                data: config
            });
        }
        // セクション内の全設定を取得（簡易実装）
        res.json({
            success: true,
            data: [],
            message: 'セクション別設定取得は今後実装予定です'
        });
    }
    catch (error) {
        console.error('Failed to get configuration:', error);
        res.status(500).json({
            success: false,
            error: '設定の取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 設定の更新
 */
router.put('/configurations/:section/:key', async (req, res) => {
    try {
        const { section, key } = req.params;
        const { value } = req.body;
        const userId = req.user?.id || 'admin';
        if (value === undefined || value === null) {
            return res.status(400).json({
                success: false,
                error: '設定値は必須です'
            });
        }
        await security_threshold_manager_service_1.securityThresholdManagerService.updateConfiguration(section, key, value, userId);
        const updatedConfig = await security_threshold_manager_service_1.securityThresholdManagerService.getConfiguration(section, key);
        res.json({
            success: true,
            message: '設定が正常に更新されました',
            data: updatedConfig
        });
    }
    catch (error) {
        console.error('Failed to update configuration:', error);
        res.status(500).json({
            success: false,
            error: '設定の更新に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 閾値設定のエクスポート
 */
router.get('/export', async (req, res) => {
    try {
        const exportData = await security_threshold_manager_service_1.securityThresholdManagerService.exportThresholds();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="security-thresholds-${Date.now()}.json"`);
        res.json(exportData);
    }
    catch (error) {
        console.error('Failed to export thresholds:', error);
        res.status(500).json({
            success: false,
            error: '閾値設定のエクスポートに失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 閾値設定のインポート
 */
router.post('/import', async (req, res) => {
    try {
        const { thresholds, configurations } = req.body;
        const userId = req.user?.id || 'admin';
        // 入力検証
        if (!Array.isArray(thresholds) || !Array.isArray(configurations)) {
            return res.status(400).json({
                success: false,
                error: '無効なインポートデータ形式です'
            });
        }
        await security_threshold_manager_service_1.securityThresholdManagerService.importThresholds({ thresholds, configurations }, userId);
        res.json({
            success: true,
            message: '閾値設定が正常にインポートされました',
            imported: {
                thresholds: thresholds.length,
                configurations: configurations.length
            }
        });
    }
    catch (error) {
        console.error('Failed to import thresholds:', error);
        res.status(500).json({
            success: false,
            error: '閾値設定のインポートに失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * セキュリティダッシュボード用の統合データ
 */
router.get('/dashboard', async (req, res) => {
    try {
        const thresholds = await security_threshold_manager_service_1.securityThresholdManagerService.getAllThresholds();
        const suggestions = await security_threshold_manager_service_1.securityThresholdManagerService.suggestOptimizations();
        // カテゴリ別の統計
        const categoryStats = thresholds.reduce((acc, threshold) => {
            if (!acc[threshold.category]) {
                acc[threshold.category] = { count: 0, lastModified: null };
            }
            acc[threshold.category].count++;
            if (!acc[threshold.category].lastModified ||
                threshold.lastModified > acc[threshold.category].lastModified) {
                acc[threshold.category].lastModified = threshold.lastModified;
            }
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                summary: {
                    totalThresholds: thresholds.length,
                    activeThresholds: thresholds.filter(t => t.isActive).length,
                    totalSuggestions: suggestions.length,
                    highPrioritySuggestions: suggestions.filter(s => s.confidence >= 80).length
                },
                thresholds: thresholds.slice(0, 10), // 最新10件
                suggestions: suggestions.slice(0, 5), // トップ5提案
                categoryStats,
                lastUpdated: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Failed to get dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'ダッシュボードデータの取得に失敗しました',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
