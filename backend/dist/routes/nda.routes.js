"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nda_controller_1 = require("../controllers/nda.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Agree to NDA
router.post('/agree', auth_1.authenticate, nda_controller_1.agreeToNDA);
exports.default = router;
//# sourceMappingURL=nda.routes.js.map