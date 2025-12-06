import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOverviewStats,
  getPerformanceMetrics,
  getComparisonData,
} from '../controllers/analytics.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get overview statistics
router.get('/overview', getOverviewStats);

// Get performance metrics (influencers only)
router.get('/performance', getPerformanceMetrics);

// Get comparison data (influencers only)
router.get('/comparison', getComparisonData);

export default router;