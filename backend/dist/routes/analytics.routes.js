"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analytics_controller_1 = require("../controllers/analytics.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get overview statistics
router.get('/overview', analytics_controller_1.getOverviewStats);
// Get performance metrics (influencers only)
router.get('/performance', analytics_controller_1.getPerformanceMetrics);
// Get comparison data (influencers only)
router.get('/comparison', analytics_controller_1.getComparisonData);
exports.default = router;
