import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReview,
  getReviewsForUser,
  getMyReviews,
  updateReview,
  deleteReview,
  getReviewableProjects,
  getRatingStats,
} from '../controllers/review.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a review
router.post('/', createReview);

// Get reviews for a specific user (public)
router.get('/user/:userId', getReviewsForUser);

// Get rating statistics for a user
router.get('/user/:userId/stats', getRatingStats);

// Get my reviews (given or received)
router.get('/my-reviews', getMyReviews);

// Get projects that can be reviewed
router.get('/reviewable-projects', getReviewableProjects);

// Update a review
router.put('/:reviewId', updateReview);

// Delete a review
router.delete('/:reviewId', deleteReview);

export default router;