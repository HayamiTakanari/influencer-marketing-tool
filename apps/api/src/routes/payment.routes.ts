import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
  getPaymentStats,
  handleStripeWebhook,
} from '../controllers/payment.controller';

const router = Router();

// Webhook endpoint (no auth required)
router.post('/webhook', handleStripeWebhook);

// All other routes require authentication
router.use(authenticate);

router.post('/create-payment-intent', createPaymentIntent);
router.post('/confirm-payment', confirmPayment);
router.get('/history', getPaymentHistory);
router.post('/refund/:transactionId', refundPayment);
router.get('/stats', getPaymentStats);

export default router;