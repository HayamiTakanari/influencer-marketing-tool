"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var analytics_controller_1 = require("../controllers/analytics.controller");
var router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Get overview statistics
router.get('/overview', analytics_controller_1.getOverviewStats);
// Get performance metrics (influencers only)
router.get('/performance', analytics_controller_1.getPerformanceMetrics);
// Get comparison data (influencers only)
router.get('/comparison', analytics_controller_1.getComparisonData);
exports.default = router;
