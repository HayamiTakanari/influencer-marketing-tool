import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReview,
  getUserReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getAverageRating,
} from '../controllers/review.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create review (Chapter 8)
router.post('/', createReview);

// Get my reviews
router.get('/my-reviews', getMyReviews);

// Get user's reviews
router.get('/user/:userId', getUserReviews);

// Get average rating for user
router.get('/rating/:userId', getAverageRating);

// Update review
router.put('/:reviewId', updateReview);

// Delete review
router.delete('/:reviewId', deleteReview);

export default router;
