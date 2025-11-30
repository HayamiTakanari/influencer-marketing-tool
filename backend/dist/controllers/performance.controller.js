"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardOverview = exports.getProjectMetrics = exports.getInfluencerMetrics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 9: Get performance metrics for influencer
const getInfluencerMetrics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!influencer) {
            return res.status(403).json({ error: 'インフルエンサー権限がありません' });
        }
        // Get project completion stats
        const completedProjects = await prisma.project.count({
            where: {
                matchedInfluencerId: influencer.id,
                status: 'COMPLETED',
            },
        });
        const totalProjects = await prisma.project.count({
            where: {
                matchedInfluencerId: influencer.id,
            },
        });
        // Get average rating
        const reviews = await prisma.review.findMany({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            select: { rating: true },
        });
        const averageRating = reviews.length > 0
            ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
            : 0;
        // Get total earnings
        const invoices = await prisma.invoice.findMany({
            where: {
                influencerId: influencer.id,
                status: 'PAID',
            },
            select: { totalAmount: true },
        });
        const totalEarnings = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        // Get response rate
        const applications = await prisma.application.findMany({
            where: {
                influencerId: influencer.id,
            },
            select: { isAccepted: true },
        });
        const acceptanceRate = applications.length > 0
            ? parseFloat(((applications.filter(a => a.isAccepted).length / applications.length) * 100).toFixed(1))
            : 0;
        res.json({
            metrics: {
                completedProjects,
                totalProjects,
                completionRate: totalProjects > 0 ? parseFloat(((completedProjects / totalProjects) * 100).toFixed(1)) : 0,
                averageRating,
                totalReviews: reviews.length,
                totalEarnings,
                applicationCount: applications.length,
                acceptanceRate,
            },
        });
    }
    catch (error) {
        console.error('Get influencer metrics error:', error);
        res.status(500).json({ error: 'メトリクス取得に失敗しました' });
    }
};
exports.getInfluencerMetrics = getInfluencerMetrics;
// Chapter 9: Get project performance metrics
const getProjectMetrics = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id;
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: { select: { userId: true } },
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'プロジェクトが見つかりません' });
        }
        if (project.client.userId !== userId) {
            return res.status(403).json({ error: '権限がありません' });
        }
        // Get application stats
        const applications = await prisma.application.findMany({
            where: { projectId },
        });
        const acceptedCount = applications.filter(a => a.isAccepted).length;
        // Get average proposal price
        const proposedPrices = applications.filter(a => a.proposedPrice).map(a => a.proposedPrice || 0);
        const avgProposalPrice = proposedPrices.length > 0
            ? Math.round(proposedPrices.reduce((sum, p) => sum + p, 0) / proposedPrices.length)
            : project.budget;
        // Get matched influencer metrics
        let influencerMetrics = null;
        if (project.matchedInfluencerId) {
            const influencer = await prisma.influencer.findUnique({
                where: { id: project.matchedInfluencerId },
                select: { user: { select: { id: true } } },
            });
            if (influencer) {
                const reviews = await prisma.review.findMany({
                    where: {
                        revieweeId: influencer.user.id,
                        isPublic: true,
                    },
                    select: { rating: true },
                });
                influencerMetrics = {
                    averageRating: reviews.length > 0
                        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
                        : 0,
                    totalReviews: reviews.length,
                };
            }
        }
        res.json({
            metrics: {
                totalApplications: applications.length,
                acceptedApplications: acceptedCount,
                acceptanceRate: applications.length > 0 ? parseFloat(((acceptedCount / applications.length) * 100).toFixed(1)) : 0,
                averageProposalPrice: avgProposalPrice,
                budgetVsAverage: project.budget,
                budgetDifference: avgProposalPrice - project.budget,
                matchedInfluencerMetrics: influencerMetrics,
            },
        });
    }
    catch (error) {
        console.error('Get project metrics error:', error);
        res.status(500).json({ error: 'プロジェクトメトリクス取得に失敗しました' });
    }
};
exports.getProjectMetrics = getProjectMetrics;
// Chapter 9: Get dashboard overview
const getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (role === 'INFLUENCER') {
            const influencer = await prisma.influencer.findUnique({
                where: { userId },
                select: { id: true },
            });
            if (!influencer) {
                return res.status(403).json({ error: 'インフルエンサー権限がありません' });
            }
            // Get recent projects
            const recentProjects = await prisma.project.findMany({
                where: {
                    matchedInfluencerId: influencer.id,
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, status: true, budget: true, createdAt: true },
            });
            // Get pending applications
            const pendingApplications = await prisma.application.findMany({
                where: {
                    influencerId: influencer.id,
                    isAccepted: false,
                },
                take: 5,
                orderBy: { appliedAt: 'desc' },
                include: {
                    project: { select: { title: true, budget: true } },
                },
            });
            res.json({
                overview: {
                    recentProjects,
                    pendingApplications,
                },
            });
        }
        else if (role === 'COMPANY' || role === 'CLIENT') {
            const client = await prisma.client.findUnique({
                where: { userId },
                select: { id: true },
            });
            if (!client) {
                return res.status(403).json({ error: 'クライアント権限がありません' });
            }
            // Get active projects
            const activeProjects = await prisma.project.findMany({
                where: {
                    clientId: client.id,
                    status: { in: ['PENDING', 'IN_PROGRESS'] },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, status: true, budget: true, createdAt: true },
            });
            // Get recent applications
            const recentApplications = await prisma.application.findMany({
                where: {
                    clientId: client.id,
                },
                take: 5,
                orderBy: { appliedAt: 'desc' },
                include: {
                    influencer: { select: { displayName: true } },
                    project: { select: { title: true } },
                },
            });
            res.json({
                overview: {
                    activeProjects,
                    recentApplications,
                },
            });
        }
    }
    catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({ error: 'ダッシュボード取得に失敗しました' });
    }
};
exports.getDashboardOverview = getDashboardOverview;
//# sourceMappingURL=performance.controller.js.map