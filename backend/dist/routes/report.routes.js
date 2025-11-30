"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
// Chapter 9: Report and export routes
router.post('/performance', auth_1.authenticate, report_controller_1.generatePerformanceReport);
router.post('/export-data', auth_1.authenticate, report_controller_1.exportUserData);
router.get('/export-history', auth_1.authenticate, report_controller_1.getExportHistory);
exports.default = router;
//# sourceMappingURL=report.routes.js.map