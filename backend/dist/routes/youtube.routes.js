"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const youtube_controller_1 = require("../controllers/youtube.controller");
const router = express_1.default.Router();
/**
 * Public endpoints (no authentication required for testing)
 */
// Get YouTube channel information by username/handle
router.get('/channel/:username', youtube_controller_1.getChannelInfo);
// Get YouTube channel statistics
router.get('/channel/:username/stats', youtube_controller_1.getChannelStats);
/**
 * Protected endpoints (authentication required)
 */
// All routes below require authentication
router.use(auth_1.authenticate);
// Verify and add YouTube channel to influencer profile
router.post('/verify-account', youtube_controller_1.verifyAndAddAccount);
exports.default = router;
//# sourceMappingURL=youtube.routes.js.map