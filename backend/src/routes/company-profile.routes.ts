import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCompanyProfile, updateCompanyProfile } from '../controllers/company-profile.controller';

const router = Router();

// 企業プロフィール用のルート
router.get('/me', authenticate, getCompanyProfile);
router.put('/me', authenticate, updateCompanyProfile);

export default router;
