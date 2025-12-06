import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInfluencerMetrics,
  getProjectMetrics,
  getDashboardOverview,
} from '../controllers/performance.controller';

const router = Router();

// Chapter 9: Performance metrics routes
router.get('/influencer', authenticate, getInfluencerMetrics);
router.get('/project/:projectId', authenticate, getProjectMetrics);
router.get('/dashboard', authenticate, getDashboardOverview);

export default router;
