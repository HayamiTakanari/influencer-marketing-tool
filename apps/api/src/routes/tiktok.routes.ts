import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getVideoInfo,
  getUserInfoFromVideo,
  verifyAndAddAccount,
  getAccountStats,
  syncAccount,
  deleteAccount,
  getUserInfo,
  getUserVideosStats,
  getUserFollowers,
  searchVideos,
} from '../controllers/tiktok.controller';

const router = express.Router();

/**
 * Public endpoints (no authentication required for testing)
 */

// Get video information from TikTok URL
router.post('/video-info', getVideoInfo);

// Get user information from TikTok video
router.post('/user-info', getUserInfoFromVideo);

// Get TikTok user information by username
router.get('/user/:username', getUserInfo);

// Get TikTok user videos statistics
router.get('/user/:username/videos-stats', getUserVideosStats);

// Get TikTok user follower information
router.get('/user/:username/followers', getUserFollowers);

// Search TikTok videos by keyword
router.get('/search', searchVideos);

/**
 * Protected endpoints (authentication required)
 */

// All routes below require authentication
router.use(authenticate);

// Verify and add TikTok account to influencer profile
router.post('/verify-account', verifyAndAddAccount);

// Get TikTok account stats
router.get('/account/:socialAccountId/stats', getAccountStats);

// Sync TikTok account data
router.post('/sync/:socialAccountId', syncAccount);

// Delete TikTok account
router.delete('/account/:socialAccountId', deleteAccount);

export default router;
