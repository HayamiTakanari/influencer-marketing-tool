import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import {
  syncSocialAccount,
  syncAllMyAccounts,
  getSyncStatus,
  syncAllInfluencers,
} from '../controllers/sns.controller';

const router = Router();

router.use(authenticate);

// Influencer routes
router.post('/sync/:socialAccountId', authorizeRole(['INFLUENCER']), syncSocialAccount);
router.post('/sync-all', authorizeRole(['INFLUENCER']), syncAllMyAccounts);
router.get('/sync-status', authorizeRole(['INFLUENCER', 'ADMIN']), getSyncStatus);

// Admin routes
router.post('/sync-all-influencers', authorizeRole(['ADMIN']), syncAllInfluencers);
router.get('/status', authorizeRole(['ADMIN']), getSyncStatus);

export default router;