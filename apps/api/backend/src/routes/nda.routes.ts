import { Router } from 'express';
import { agreeToNDA } from '../controllers/nda.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Agree to NDA
router.post('/agree', authenticate, agreeToNDA);

export default router;
