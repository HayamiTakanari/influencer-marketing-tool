import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  searchInfluencers,
  getInfluencerById,
  getInfluencerStats,
  getCategories,
  getPrefectures,
} from '../controllers/influencer.controller';

const router = Router();

router.get('/search', authenticate, searchInfluencers);
router.get('/categories', authenticate, getCategories);
router.get('/prefectures', authenticate, getPrefectures);
router.get('/:id', authenticate, getInfluencerById);
router.get('/:id/stats', authenticate, getInfluencerStats);

export default router;