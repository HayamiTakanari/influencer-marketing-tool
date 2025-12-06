import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLegalDocuments,
  getLegalDocument,
  acceptLegalDocument,
  getUserConsentStatus,
  getComplianceReport,
  createLegalDocument,
} from '../controllers/legal-compliance.controller';

const router = Router();

// Chapter 14: Legal and compliance routes
router.get('/documents', getLegalDocuments);
router.get('/documents/:documentId', getLegalDocument);
router.post('/documents/:documentId/accept', authenticate, acceptLegalDocument);
router.get('/consent-status', authenticate, getUserConsentStatus);
router.get('/compliance-report', authenticate, getComplianceReport);
router.post('/documents', authenticate, createLegalDocument);

export default router;
