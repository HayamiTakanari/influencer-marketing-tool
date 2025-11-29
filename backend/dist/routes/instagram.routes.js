"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const instagram_controller_1 = require("../controllers/instagram.controller");
const router = express_1.default.Router();
/**
 * Public endpoints (no authentication required for testing)
 */
// Get Instagram user information by username
router.get('/user/:username', instagram_controller_1.getUserInfo);
// Get Instagram user statistics
router.get('/user/:username/stats', instagram_controller_1.getUserStats);
/**
 * Protected endpoints (authentication required)
 */
// All routes below require authentication
router.use(auth_1.authenticate);
// Verify and add Instagram account to influencer profile
router.post('/verify-account', instagram_controller_1.verifyAndAddAccount);
exports.default = router;
