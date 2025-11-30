"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const company_profile_controller_1 = require("../controllers/company-profile.controller");
const router = (0, express_1.Router)();
// 企業プロフィール用のルート
router.get('/me', auth_1.authenticate, company_profile_controller_1.getCompanyProfile);
router.put('/me', auth_1.authenticate, company_profile_controller_1.updateCompanyProfile);
exports.default = router;
//# sourceMappingURL=company-profile.routes.js.map