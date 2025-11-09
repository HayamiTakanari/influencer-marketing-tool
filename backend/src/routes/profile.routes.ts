import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import {
  getMyProfile,
  updateProfile,
  addSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
  uploadPortfolioImage,
  completeRegistration,
  getProfileCompletion,
} from '../controllers/profile.controller';

const router = Router();

// All routes require authentication and INFLUENCER role
router.use(authenticate);
router.use(authorizeRole(['INFLUENCER']));

router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/me/complete-registration', completeRegistration);
router.get('/me/completion', getProfileCompletion);

router.post('/social-accounts', addSocialAccount);
router.put('/social-accounts/:id', updateSocialAccount);
router.delete('/social-accounts/:id', deleteSocialAccount);

router.post('/portfolio', addPortfolio);
router.put('/portfolio/:id', updatePortfolio);
router.delete('/portfolio/:id', deletePortfolio);
router.post('/portfolio/:portfolioId/image', uploadPortfolioImage);

export default router;