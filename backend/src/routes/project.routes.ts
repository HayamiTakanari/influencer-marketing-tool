import express from 'express';
import { authenticate } from '../middleware/auth';
import { verifySNSConnections } from '../middleware/sns-verification';
import {
  getAvailableProjects,
  applyToProject,
  getMyApplications,
  getApplicationsForMyProjects,
  acceptApplication,
  rejectApplication,
  getProjectCategories,
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
} from '../controllers/project.controller';
import {
  getProjectSchedule,
  createProjectSchedule,
  updateMilestone as updateProjectSchedule,
} from '../controllers/schedule.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get available projects (for influencers)
router.get('/available', getAvailableProjects);

// Apply to a project (for influencers) - SNS連携必須
router.post('/apply', verifySNSConnections, applyToProject);

// Get my applications (for influencers)
router.get('/my-applications', getMyApplications);

// Get applications for my projects (for clients)
router.get('/applications', getApplicationsForMyProjects);

// Accept an application (for clients)
router.put('/applications/:applicationId/accept', acceptApplication);

// Reject an application (for clients)
router.delete('/applications/:applicationId/reject', rejectApplication);

// Get project categories
router.get('/categories', getProjectCategories);

// Project CRUD operations
// Create a new project (for clients)
router.post('/', createProject);

// Get my projects (for clients)
router.get('/my-projects', getMyProjects);

// Get project by ID
router.get('/:projectId', getProjectById);

// プロジェクトスケジュール関連ルート
router.get('/:projectId/schedule', getProjectSchedule);
router.post('/:projectId/schedule', createProjectSchedule);
router.put('/:projectId/schedule', updateProjectSchedule);

// Update project (for clients)
router.put('/:projectId', updateProject);

// Update project status (for clients)
router.put('/:projectId/status', updateProjectStatus);

// Delete project (for clients)
router.delete('/:projectId', deleteProject);

export default router;