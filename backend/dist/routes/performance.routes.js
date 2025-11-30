"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const performance_controller_1 = require("../controllers/performance.controller");
const router = (0, express_1.Router)();
// Chapter 9: Performance metrics routes
router.get('/influencer', auth_1.authenticate, performance_controller_1.getInfluencerMetrics);
router.get('/project/:projectId', auth_1.authenticate, performance_controller_1.getProjectMetrics);
router.get('/dashboard', auth_1.authenticate, performance_controller_1.getDashboardOverview);
exports.default = router;
//# sourceMappingURL=performance.routes.js.map