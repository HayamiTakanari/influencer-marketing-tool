"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const security_monitoring_controller_1 = require("../controllers/security-monitoring.controller");
const router = (0, express_1.Router)();
// Chapter 9: Security monitoring routes
router.post('/event', auth_1.authenticate, security_monitoring_controller_1.logSecurityEvent);
router.get('/logs', auth_1.authenticate, security_monitoring_controller_1.getSecurityLogs);
router.get('/anomalies', auth_1.authenticate, security_monitoring_controller_1.detectAnomalies);
router.get('/suspicious-users', auth_1.authenticate, security_monitoring_controller_1.getSuspiciousUsers);
exports.default = router;
//# sourceMappingURL=security-monitoring.routes.js.map