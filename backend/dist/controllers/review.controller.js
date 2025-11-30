"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAverageRating = exports.deleteReview = exports.updateReview = exports.getMyReviews = exports.getUserReviews = exports.createReview = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Chapter 8: Review and rating system
const createReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { projectId, revieweeId, rating, comment, isPublic } = req.body;
        if (!projectId || !revieweeId || !rating) {
            return res.status(400).json({ error: '必須項目が不足しています' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: '評価は1～5の間で指定してください' });
        }
        // Check if user already reviewed
        const existingReview = await prisma.review.findUnique({
            where: {
                projectId_reviewerId: {
                    projectId,
                    reviewerId: userId,
                },
            },
        });
        if (existingReview) {
            return res.status(400).json({ error: 'すでにレビューを投稿しています' });
        }
        // Get reviewer info to determine influencer/client
        const influencer = await prisma.influencer.findUnique({
            where: { userId },
        });
        const client = await prisma.client.findUnique({
            where: { userId },
        });
        const review = await prisma.review.create({
            data: {
                projectId,
                reviewerId: userId,
                revieweeId,
                rating,
                comment: comment || null,
                isPublic: isPublic !== false,
                influencerId: influencer?.id || null,
                clientId: client?.id || null,
            },
            include: {
                reviewer: { select: { email: true } },
                reviewee: { select: { email: true } },
            },
        });
        // Create notification
        await prisma.notification.create({
            data: {
                userId: revieweeId,
                type: 'PAYMENT_COMPLETED',
                title: 'レビューを受け取りました',
                message: `あなたは${rating}つ星のレビューを受け取りました`,
                data: {
                    projectId,
                    reviewId: review.id,
                    rating,
                },
            },
        });
        res.status(201).json({
            message: 'レビューを投稿しました',
            review,
        });
    }
    catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({ error: 'レビューの投稿に失敗しました' });
    }
};
exports.createReview = createReview;
// Get reviews for a user
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await prisma.review.findMany({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
            include: {
                reviewer: { select: { email: true } },
                project: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;
        res.json({
            reviews,
            stats: {
                totalReviews: reviews.length,
                averageRating,
            },
        });
    }
    catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'レビューの取得に失敗しました' });
    }
};
exports.getUserReviews = getUserReviews;
// Get reviews given by a user
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user?.id;
        const reviews = await prisma.review.findMany({
            where: { reviewerId: userId },
            include: {
                reviewee: { select: { email: true } },
                project: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ reviews });
    }
    catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({ error: 'レビューの取得に失敗しました' });
    }
};
exports.getMyReviews = getMyReviews;
// Update review
const updateReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        // Check ownership
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review || review.reviewerId !== userId) {
            return res.status(403).json({ error: '権限がありません' });
        }
        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: rating || review.rating,
                comment: comment !== undefined ? comment : review.comment,
            },
        });
        res.json({
            message: 'レビューを更新しました',
            review: updated,
        });
    }
    catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ error: 'レビューの更新に失敗しました' });
    }
};
exports.updateReview = updateReview;
// Delete review
const deleteReview = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { reviewId } = req.params;
        // Check ownership
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review || review.reviewerId !== userId) {
            return res.status(403).json({ error: '権限がありません' });
        }
        await prisma.review.delete({
            where: { id: reviewId },
        });
        res.json({ message: 'レビューを削除しました' });
    }
    catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'レビューの削除に失敗しました' });
    }
};
exports.deleteReview = deleteReview;
// Get average rating for a user
const getAverageRating = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await prisma.review.findMany({
            where: {
                revieweeId: userId,
                isPublic: true,
            },
        });
        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;
        const distribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length,
        };
        res.json({
            userId,
            averageRating: parseFloat(averageRating),
            totalReviews: reviews.length,
            distribution,
        });
    }
    catch (error) {
        console.error('Get average rating error:', error);
        res.status(500).json({ error: '評価の取得に失敗しました' });
    }
};
exports.getAverageRating = getAverageRating;
//# sourceMappingURL=review.controller.js.map