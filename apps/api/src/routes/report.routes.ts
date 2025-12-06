import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generatePerformanceReport,
  exportUserData,
  getExportHistory,
} from '../controllers/report.controller';

const router = Router();

// Chapter 9: Report and export routes
router.post('/performance', authenticate, generatePerformanceReport);
router.post('/export-data', authenticate, exportUserData);
router.get('/export-history', authenticate, getExportHistory);

export default router;
