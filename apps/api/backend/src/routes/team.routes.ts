import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTeam,
  getMyTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  deleteTeam,
} from '../controllers/team.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new team
router.post('/', createTeam);

// Get my team information
router.get('/my-team', getMyTeam);

// Update team information
router.put('/:teamId', updateTeam);

// Add a member to the team
router.post('/:teamId/members', addTeamMember);

// Remove a member from the team
router.delete('/:teamId/members/:memberId', removeTeamMember);

// Update member role (owner/member)
router.put('/:teamId/members/:memberId/role', updateMemberRole);

// Delete team
router.delete('/:teamId', deleteTeam);

export default router;