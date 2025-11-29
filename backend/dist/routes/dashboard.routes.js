"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', dashboard_controller_1.getDashboardData);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map