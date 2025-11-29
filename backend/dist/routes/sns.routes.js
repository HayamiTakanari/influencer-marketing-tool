"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sns_controller_1 = require("../controllers/sns.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Influencer routes
router.post('/sync/:socialAccountId', (0, auth_1.authorizeRole)(['INFLUENCER']), sns_controller_1.syncSocialAccount);
router.post('/sync-all', (0, auth_1.authorizeRole)(['INFLUENCER']), sns_controller_1.syncAllMyAccounts);
router.get('/sync-status', (0, auth_1.authorizeRole)(['INFLUENCER', 'ADMIN']), sns_controller_1.getSyncStatus);
// Admin routes
router.post('/sync-all-influencers', (0, auth_1.authorizeRole)(['ADMIN']), sns_controller_1.syncAllInfluencers);
router.get('/status', (0, auth_1.authorizeRole)(['ADMIN']), sns_controller_1.getSyncStatus);
exports.default = router;
