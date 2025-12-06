import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getChannelInfo,
  getChannelStats,
  verifyAndAddAccount,
} from '../controllers/youtube.controller';

const router = express.Router();

/**
 * Public endpoints (no authentication required for testing)
 */

// Get YouTube channel information by username/handle
router.get('/channel/:username', getChannelInfo);

// Get YouTube channel statistics
router.get('/channel/:username/stats', getChannelStats);

/**
 * Protected endpoints (authentication required)
 */

// All routes below require authentication
router.use(authenticate);

// Verify and add YouTube channel to influencer profile
router.post('/verify-account', verifyAndAddAccount);

export default router;
