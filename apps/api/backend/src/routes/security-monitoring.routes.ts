import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  logSecurityEvent,
  getSecurityLogs,
  detectAnomalies,
  getSuspiciousUsers,
} from '../controllers/security-monitoring.controller';

const router = Router();

// Chapter 9: Security monitoring routes
router.post('/event', authenticate, logSecurityEvent);
router.get('/logs', authenticate, getSecurityLogs);
router.get('/anomalies', authenticate, detectAnomalies);
router.get('/suspicious-users', authenticate, getSuspiciousUsers);

export default router;
