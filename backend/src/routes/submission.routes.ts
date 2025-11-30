import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createSubmission,
  getProjectSubmissions,
  getInfluencerSubmissions,
  approveSubmission,
  requestRevision,
  rejectSubmission,
} from '../controllers/submission.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create submission (influencer submits deliverable)
router.post('/', createSubmission);

// Get influencer's own submissions
router.get('/influencer/my-submissions', getInfluencerSubmissions);

// Get submissions for a specific project (company view)
router.get('/project/:projectId', getProjectSubmissions);

// Approve a submission
router.put('/:submissionId/approve', approveSubmission);

// Request revision on submission
router.put('/:submissionId/revision', requestRevision);

// Reject a submission
router.put('/:submissionId/reject', rejectSubmission);

export default router;
