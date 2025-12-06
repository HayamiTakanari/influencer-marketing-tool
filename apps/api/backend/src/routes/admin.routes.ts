import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDashboardStats,
  getCompanies,
  getInfluencers,
  getProjects,
  getProjectDetail,
  getUsers,
  updateUserStatus,
  deleteUser,
  updateProjectProgress,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Companies
router.get('/companies', getCompanies);

// Influencers
router.get('/influencers', getInfluencers);

// Projects
router.get('/projects', getProjects);
router.get('/projects/:projectId', getProjectDetail);
router.patch('/projects/:projectId/progress', updateProjectProgress);

// Users
router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

export default router;
