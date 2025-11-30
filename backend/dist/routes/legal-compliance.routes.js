"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const legal_compliance_controller_1 = require("../controllers/legal-compliance.controller");
const router = (0, express_1.Router)();
// Chapter 14: Legal and compliance routes
router.get('/documents', legal_compliance_controller_1.getLegalDocuments);
router.get('/documents/:documentId', legal_compliance_controller_1.getLegalDocument);
router.post('/documents/:documentId/accept', auth_1.authenticate, legal_compliance_controller_1.acceptLegalDocument);
router.get('/consent-status', auth_1.authenticate, legal_compliance_controller_1.getUserConsentStatus);
router.get('/compliance-report', auth_1.authenticate, legal_compliance_controller_1.getComplianceReport);
router.post('/documents', auth_1.authenticate, legal_compliance_controller_1.createLegalDocument);
exports.default = router;
//# sourceMappingURL=legal-compliance.routes.js.map