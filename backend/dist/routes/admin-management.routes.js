"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const admin_management_controller_1 = require("../controllers/admin-management.controller");
const router = (0, express_1.Router)();
// Chapter 12: Admin management routes
router.get('/users', auth_1.authenticate, admin_management_controller_1.getAllUsers);
router.post('/users/:userId/suspend', auth_1.authenticate, admin_management_controller_1.suspendUser);
router.post('/users/:userId/reactivate', auth_1.authenticate, admin_management_controller_1.reactivateUser);
router.get('/projects', auth_1.authenticate, admin_management_controller_1.getProjectReports);
router.get('/moderation-queue', auth_1.authenticate, admin_management_controller_1.getModerationQueue);
router.post('/submissions/:submissionId/approve', auth_1.authenticate, admin_management_controller_1.approveContent);
router.get('/dashboard', auth_1.authenticate, admin_management_controller_1.getAdminDashboard);
exports.default = router;
//# sourceMappingURL=admin-management.routes.js.map