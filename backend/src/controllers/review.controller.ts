import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Chapter 8: Review and rating system
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { projectId, revieweeId, rating, comment } = req.body;

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
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'レビューの投稿に失敗しました' });
  }
};

// Get reviews for a user
export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
      },
      include: {
        reviewer: { select: { email: true } },
        project: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'レビューの取得に失敗しました' });
  }
};

// Get reviews given by a user
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const reviews = await prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        reviewee: { select: { email: true } },
        project: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ error: 'レビューの取得に失敗しました' });
  }
};

// Update review
export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
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
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'レビューの更新に失敗しました' });
  }
};

// Delete review
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
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
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'レビューの削除に失敗しました' });
  }
};

// Get average rating for a user
export const getAverageRating = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
      },
    });

    const averageRating =
      reviews.length > 0
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
      averageRating: parseFloat(averageRating as string),
      totalReviews: reviews.length,
      distribution,
    });
  } catch (error) {
    console.error('Get average rating error:', error);
    res.status(500).json({ error: '評価の取得に失敗しました' });
  }
};
