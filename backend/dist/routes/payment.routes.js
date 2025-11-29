"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
// Webhook endpoint (no auth required)
router.post('/webhook', payment_controller_1.handleStripeWebhook);
// All other routes require authentication
router.use(auth_1.authenticate);
router.post('/create-payment-intent', payment_controller_1.createPaymentIntent);
router.post('/confirm-payment', payment_controller_1.confirmPayment);
router.get('/history', payment_controller_1.getPaymentHistory);
router.post('/refund/:transactionId', payment_controller_1.refundPayment);
router.get('/stats', payment_controller_1.getPaymentStats);
exports.default = router;
