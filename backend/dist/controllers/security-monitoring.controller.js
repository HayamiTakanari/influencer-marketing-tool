"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuspiciousUsers = exports.detectAnomalies = exports.getSecurityLogs = exports.logSecurityEvent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 9: Log security event
const logSecurityEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { eventType, severity, description, metadata } = req.body;
        if (!eventType || !severity) {
            return res.status(400).json({ error: '必須項目が不足しています' });
        }
        const systemLog = await prisma.systemLog.create({
            data: {
                userId,
                action: eventType || 'SECURITY_EVENT',
                entityType: 'SecurityEvent',
                entityId: '',
                details: { eventType, severity, description, metadata: metadata || {} },
                ipAddress: req.ip,
            },
        });
        res.status(201).json({
            message: 'セキュリティイベントを記録しました',
            log: systemLog,
        });
    }
    catch (error) {
        console.error('Log security event error:', error);
        res.status(500).json({ error: 'イベント記録に失敗しました' });
    }
};
exports.logSecurityEvent = logSecurityEvent;
// Chapter 9: Get security logs
const getSecurityLogs = async (req, res) => {
    try {
        const role = req.user?.role;
        // Only admin can access security logs
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { limit = '50' } = req.query;
        const pageSize = Math.min(parseInt(limit), 100);
        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            include: {
                user: { select: { email: true, role: true } },
            },
        });
        res.json({ logs });
    }
    catch (error) {
        console.error('Get security logs error:', error);
        res.status(500).json({ error: 'ログ取得に失敗しました' });
    }
};
exports.getSecurityLogs = getSecurityLogs;
// Chapter 9: Detect anomalies
const detectAnomalies = async (req, res) => {
    try {
        const role = req.user?.role;
        // Only admin can access anomaly detection
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const anomalies = [];
        // 1. Detect unusual application patterns
        const applicationsLast24h = await prisma.application.findMany({
            where: {
                appliedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        const applicationsPerInfluencer = {};
        for (const app of applicationsLast24h) {
            applicationsPerInfluencer[app.influencerId] = (applicationsPerInfluencer[app.influencerId] || 0) + 1;
        }
        for (const [influencerId, count] of Object.entries(applicationsPerInfluencer)) {
            if (count > 10) {
                anomalies.push({
                    type: 'UNUSUAL_APPLICATION_VOLUME',
                    severity: 'HIGH',
                    influencerId,
                    description: `24時間内に${count}件の応募を受け取りました`,
                    timestamp: new Date(),
                });
            }
        }
        // 2. Detect failed login attempts
        const failedLogins = await prisma.systemLog.findMany({
            where: {
                action: 'LOGIN_FAILED',
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                },
            },
        });
        const failedPerUser = {};
        for (const log of failedLogins) {
            if (log.userId) {
                failedPerUser[log.userId] = (failedPerUser[log.userId] || 0) + 1;
            }
        }
        for (const [userId, count] of Object.entries(failedPerUser)) {
            if (count > 5) {
                anomalies.push({
                    type: 'SUSPICIOUS_LOGIN_ATTEMPTS',
                    severity: 'CRITICAL',
                    userId,
                    description: `1時間内に${count}回のログイン失敗があります`,
                    timestamp: new Date(),
                });
            }
        }
        // 3. Detect unusual price proposals
        const applications = await prisma.application.findMany({
            where: {
                proposedPrice: { not: null },
            },
            take: 1000,
            select: { proposedPrice: true, projectId: true },
        });
        const projectPrices = {};
        for (const app of applications) {
            if (app.proposedPrice) {
                if (!projectPrices[app.projectId]) {
                    projectPrices[app.projectId] = [];
                }
                projectPrices[app.projectId].push(app.proposedPrice);
            }
        }
        for (const [projectId, prices] of Object.entries(projectPrices)) {
            if (prices.length > 2) {
                const avg = prices.reduce((a, b) => a + b) / prices.length;
                const outliers = prices.filter(p => Math.abs(p - avg) > avg * 0.5);
                if (outliers.length > 0) {
                    anomalies.push({
                        type: 'UNUSUAL_PRICE_PROPOSAL',
                        severity: 'MEDIUM',
                        projectId,
                        description: `異常な価格提案があります（平均${Math.round(avg)}円、${outliers.length}件の異常値）`,
                        timestamp: new Date(),
                    });
                }
            }
        }
        res.json({
            anomalies,
            count: anomalies.length,
            timestamp: new Date(),
        });
    }
    catch (error) {
        console.error('Detect anomalies error:', error);
        res.status(500).json({ error: 'アノマリー検出に失敗しました' });
    }
};
exports.detectAnomalies = detectAnomalies;
// Chapter 9: Get suspicious users
const getSuspiciousUsers = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Get users with multiple failed login attempts
        const suspiciousLogs = await prisma.systemLog.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
            include: {
                user: { select: { id: true, email: true, role: true, lastLoginAt: true } },
            },
        });
        const suspiciousUsers = new Map();
        for (const log of suspiciousLogs) {
            if (log.userId) {
                const key = log.userId;
                if (!suspiciousUsers.has(key)) {
                    suspiciousUsers.set(key, {
                        user: log.user,
                        incidents: [],
                    });
                }
                suspiciousUsers.get(key).incidents.push({
                    type: log.action,
                    timestamp: log.createdAt,
                    entityType: log.entityType,
                });
            }
        }
        res.json({
            suspiciousUsers: Array.from(suspiciousUsers.values()),
            count: suspiciousUsers.size,
        });
    }
    catch (error) {
        console.error('Get suspicious users error:', error);
        res.status(500).json({ error: '疑わしいユーザーの取得に失敗しました' });
    }
};
exports.getSuspiciousUsers = getSuspiciousUsers;
//# sourceMappingURL=security-monitoring.controller.js.map