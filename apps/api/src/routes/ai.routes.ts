import express from 'express';
import { authenticate } from '../middleware/auth';
import { recommendInfluencersForProject } from '../controllers/ai.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get AI recommendations for a project
router.post('/recommend-influencers-for-project', recommendInfluencersForProject);

export default router;
