import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserInfo,
  getUserStats,
  verifyAndAddAccount,
} from '../controllers/twitter.controller';

const router = express.Router();

/**
 * Public endpoints (no authentication required for testing)
 */

// Get Twitter user information by username
router.get('/user/:username', getUserInfo);

// Get Twitter user statistics
router.get('/user/:username/stats', getUserStats);

/**
 * Protected endpoints (authentication required)
 */

// All routes below require authentication
router.use(authenticate);

// Verify and add Twitter account to influencer profile
router.post('/verify-account', verifyAndAddAccount);

export default router;
