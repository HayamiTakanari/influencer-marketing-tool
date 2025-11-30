"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
// Chapter 7: Invoice routes
router.post('/', auth_1.authenticate, invoice_controller_1.createInvoice);
router.get('/pending', auth_1.authenticate, invoice_controller_1.getPendingInvoices);
router.get('/:invoiceId', auth_1.authenticate, invoice_controller_1.getInvoice);
router.patch('/:invoiceId/paid', auth_1.authenticate, invoice_controller_1.markAsPaid);
router.get('/summary', auth_1.authenticate, invoice_controller_1.getInvoiceSummary);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map