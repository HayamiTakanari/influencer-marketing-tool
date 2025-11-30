import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCompanyProfile,
  updateCompanyProfile
} from '../controllers/company-profile.controller';

const router = Router();

// Get company profile for authenticated user
router.get('/me', authenticate, getCompanyProfile);

// Update company profile for authenticated user
router.put('/me', authenticate, updateCompanyProfile);

export default router;
