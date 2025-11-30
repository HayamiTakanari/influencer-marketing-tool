"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const faq_controller_1 = require("../controllers/faq.controller");
const router = (0, express_1.Router)();
router.get('/', faq_controller_1.getFAQs);
exports.default = router;
//# sourceMappingURL=faq.routes.js.map