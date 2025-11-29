"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const tiktok_controller_1 = require("../controllers/tiktok.controller");
const router = express_1.default.Router();
/**
 * Public endpoints (no authentication required for testing)
 */
// Get video information from TikTok URL
router.post('/video-info', tiktok_controller_1.getVideoInfo);
// Get user information from TikTok video
router.post('/user-info', tiktok_controller_1.getUserInfoFromVideo);
// Get TikTok user information by username
router.get('/user/:username', tiktok_controller_1.getUserInfo);
// Get TikTok user videos statistics
router.get('/user/:username/videos-stats', tiktok_controller_1.getUserVideosStats);
// Get TikTok user follower information
router.get('/user/:username/followers', tiktok_controller_1.getUserFollowers);
// Search TikTok videos by keyword
router.get('/search', tiktok_controller_1.searchVideos);
/**
 * Protected endpoints (authentication required)
 */
// All routes below require authentication
router.use(auth_1.authenticate);
// Verify and add TikTok account to influencer profile
router.post('/verify-account', tiktok_controller_1.verifyAndAddAccount);
// Get TikTok account stats
router.get('/account/:socialAccountId/stats', tiktok_controller_1.getAccountStats);
// Sync TikTok account data
router.post('/sync/:socialAccountId', tiktok_controller_1.syncAccount);
// Delete TikTok account
router.delete('/account/:socialAccountId', tiktok_controller_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=tiktok.routes.js.map