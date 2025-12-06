import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendScoutInvitation,
  acceptScout,
  rejectScout,
  getMyScoutInvitations,
  getMySentScouts,
  getScoutDetails,
} from '../controllers/scout.controller';

const router = Router();

// Chapter 3: Scout routes
router.post('/', authenticate, sendScoutInvitation);
router.post('/:scoutId/accept', authenticate, acceptScout);
router.post('/:scoutId/reject', authenticate, rejectScout);
router.get('/my/invitations', authenticate, getMyScoutInvitations);
router.get('/my/sent', authenticate, getMySentScouts);
router.get('/:scoutId', authenticate, getScoutDetails);

export default router;
