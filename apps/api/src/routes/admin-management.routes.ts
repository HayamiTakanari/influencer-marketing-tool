import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAllUsers,
  suspendUser,
  reactivateUser,
  getProjectReports,
  getModerationQueue,
  approveContent,
  getAdminDashboard,
} from '../controllers/admin-management.controller';

const router = Router();

// Chapter 12: Admin management routes
router.get('/users', authenticate, getAllUsers);
router.post('/users/:userId/suspend', authenticate, suspendUser);
router.post('/users/:userId/reactivate', authenticate, reactivateUser);
router.get('/projects', authenticate, getProjectReports);
router.get('/moderation-queue', authenticate, getModerationQueue);
router.post('/submissions/:submissionId/approve', authenticate, approveContent);
router.get('/dashboard', authenticate, getAdminDashboard);

export default router;
