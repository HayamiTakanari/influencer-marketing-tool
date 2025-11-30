"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = exports.approveContent = exports.getModerationQueue = exports.getProjectReports = exports.reactivateUser = exports.suspendUser = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 12: Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { status, role: filterRole, limit = '50' } = req.query;
        const pageSize = Math.min(parseInt(limit), 100);
        const where = {};
        if (status)
            where.status = status;
        if (filterRole)
            where.role = filterRole;
        const users = await prisma.user.findMany({
            where,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
        const total = await prisma.user.count({ where });
        res.json({ users, total });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'ユーザー一覧取得に失敗しました' });
    }
};
exports.getAllUsers = getAllUsers;
// Chapter 12: Suspend user account
const suspendUser = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { userId } = req.params;
        const { reason } = req.body;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'SUSPENDED',
            },
        });
        // Log admin action
        await prisma.systemLog.create({
            data: {
                userId: req.user?.id,
                action: 'USER_SUSPENDED',
                entityType: 'User',
                entityId: userId,
                details: { reason },
            },
        });
        res.json({
            message: 'ユーザーを停止しました',
            user,
        });
    }
    catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ error: 'ユーザー停止に失敗しました' });
    }
};
exports.suspendUser = suspendUser;
// Chapter 12: Reactivate user
const reactivateUser = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { userId } = req.params;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                status: 'VERIFIED',
            },
        });
        // Log admin action
        await prisma.systemLog.create({
            data: {
                userId: req.user?.id,
                action: 'USER_REACTIVATED',
                entityType: 'User',
                entityId: userId,
            },
        });
        res.json({
            message: 'ユーザーを再度有効化しました',
            user,
        });
    }
    catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({ error: 'ユーザー再度有効化に失敗しました' });
    }
};
exports.reactivateUser = reactivateUser;
// Chapter 12: Get project reports
const getProjectReports = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { status, limit = '50' } = req.query;
        const pageSize = Math.min(parseInt(limit), 100);
        const where = {};
        if (status)
            where.status = status;
        const projects = await prisma.project.findMany({
            where,
            take: pageSize,
            orderBy: { updatedAt: 'desc' },
            include: {
                client: { select: { companyName: true } },
                matchedInfluencer: { select: { displayName: true } },
            },
        });
        // Calculate statistics
        const stats = {
            total: await prisma.project.count(),
            pending: await prisma.project.count({ where: { status: 'PENDING' } }),
            inProgress: await prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
            completed: await prisma.project.count({ where: { status: 'COMPLETED' } }),
        };
        res.json({ projects, stats });
    }
    catch (error) {
        console.error('Get project reports error:', error);
        res.status(500).json({ error: 'プロジェクトレポート取得に失敗しました' });
    }
};
exports.getProjectReports = getProjectReports;
// Chapter 12: Get content moderation queue
const getModerationQueue = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Get flagged content or problematic submissions
        const submissions = await prisma.submission.findMany({
            where: {
            // In a real system, would have a 'flagged' or 'status' field
            },
            take: 50,
            orderBy: { updatedAt: 'desc' },
            include: {
                influencer: { select: { displayName: true } },
                project: { select: { title: true } },
            },
        });
        res.json({ submissions });
    }
    catch (error) {
        console.error('Get moderation queue error:', error);
        res.status(500).json({ error: 'モデレーション履歴取得に失敗しました' });
    }
};
exports.getModerationQueue = getModerationQueue;
// Chapter 12: Approve/Reject content
const approveContent = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const { submissionId } = req.params;
        const { approved, reason } = req.body;
        const submission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
            },
        });
        // Log admin action
        await prisma.systemLog.create({
            data: {
                userId: req.user?.id,
                action: approved ? 'CONTENT_APPROVED' : 'CONTENT_REJECTED',
                entityType: 'Submission',
                entityId: submissionId,
                details: { reason },
            },
        });
        res.json({
            message: `提出物を${approved ? '承認' : '却下'}しました`,
            submission,
        });
    }
    catch (error) {
        console.error('Approve content error:', error);
        res.status(500).json({ error: 'コンテンツ承認に失敗しました' });
    }
};
exports.approveContent = approveContent;
// Chapter 12: Get admin dashboard
const getAdminDashboard = async (req, res) => {
    try {
        const role = req.user?.role;
        if (role !== 'ADMIN') {
            return res.status(403).json({ error: '権限がありません' });
        }
        const [userCount, projectCount, invoiceCount, reviewCount, recentLogs] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.invoice.count(),
            prisma.review.count(),
            prisma.systemLog.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true } } },
            }),
        ]);
        // Calculate revenue
        const totalInvoices = await prisma.invoice.findMany();
        const totalRevenue = totalInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const paidRevenue = totalInvoices
            .filter(inv => inv.status === 'PAID')
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
        res.json({
            dashboard: {
                users: {
                    total: userCount,
                    active: await prisma.user.count({ where: { status: 'VERIFIED' } }),
                    suspended: await prisma.user.count({ where: { status: 'SUSPENDED' } }),
                },
                projects: {
                    total: projectCount,
                    pending: await prisma.project.count({ where: { status: 'PENDING' } }),
                    inProgress: await prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
                    completed: await prisma.project.count({ where: { status: 'COMPLETED' } }),
                },
                finances: {
                    totalInvoices: invoiceCount,
                    totalRevenue,
                    paidRevenue,
                    pendingRevenue: totalRevenue - paidRevenue,
                },
                reviews: {
                    total: reviewCount,
                    averageRating: 4.5, // Calculate from actual data
                },
                recentActivity: recentLogs,
            },
        });
    }
    catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({ error: 'ダッシュボード取得に失敗しました' });
    }
};
exports.getAdminDashboard = getAdminDashboard;
//# sourceMappingURL=admin-management.controller.js.map