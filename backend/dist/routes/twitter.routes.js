"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const twitter_controller_1 = require("../controllers/twitter.controller");
const router = express_1.default.Router();
/**
 * Public endpoints (no authentication required for testing)
 */
// Get Twitter user information by username
router.get('/user/:username', twitter_controller_1.getUserInfo);
// Get Twitter user statistics
router.get('/user/:username/stats', twitter_controller_1.getUserStats);
/**
 * Protected endpoints (authentication required)
 */
// All routes below require authentication
router.use(auth_1.authenticate);
// Verify and add Twitter account to influencer profile
router.post('/verify-account', twitter_controller_1.verifyAndAddAccount);
exports.default = router;
//# sourceMappingURL=twitter.routes.js.map