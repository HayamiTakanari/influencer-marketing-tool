"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var dashboard_controller_1 = require("../controllers/dashboard.controller");
var router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', dashboard_controller_1.getDashboardData);
exports.default = router;
