"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// All admin routes require authentication and ADMIN role
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('ADMIN'));
// Dashboard
router.get('/dashboard', admin_controller_1.getDashboardStats);
// Companies
router.get('/companies', admin_controller_1.getCompanies);
// Influencers
router.get('/influencers', admin_controller_1.getInfluencers);
// Projects
router.get('/projects', admin_controller_1.getProjects);
router.get('/projects/:projectId', admin_controller_1.getProjectDetail);
router.patch('/projects/:projectId/progress', admin_controller_1.updateProjectProgress);
// Users
router.get('/users', admin_controller_1.getUsers);
router.patch('/users/:userId/status', admin_controller_1.updateUserStatus);
router.delete('/users/:userId', admin_controller_1.deleteUser);
exports.default = router;
