import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createInvoice,
  getPendingInvoices,
  getInvoice,
  markAsPaid,
  getInvoiceSummary,
} from '../controllers/invoice.controller';

const router = Router();

// Chapter 7: Invoice routes
router.post('/', authenticate, createInvoice);
router.get('/pending', authenticate, getPendingInvoices);
router.get('/:invoiceId', authenticate, getInvoice);
router.patch('/:invoiceId/paid', authenticate, markAsPaid);
router.get('/summary', authenticate, getInvoiceSummary);

export default router;
