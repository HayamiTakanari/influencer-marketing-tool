"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var security_controller_1 = require("../controllers/security.controller");
var security_1 = require("../middleware/security");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// CSP違反レポートエンドポイント（認証不要、レート制限あり）
router.post('/csp-report', security_1.generalRateLimit, security_controller_1.handleCSPReport);
// XSS攻撃試行レポートエンドポイント（認証不要、レート制限あり）
router.post('/xss-attempt', security_1.authRateLimit, // より厳しいレート制限
security_controller_1.handleXSSAttempt);
// セキュリティ統計情報（管理者のみ）
router.get('/stats', auth_1.authenticate, security_controller_1.getSecurityStats);
exports.default = router;
