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

router.get('/search', searchInfluencers);
router.get('/categories', getCategories);
router.get('/prefectures', getPrefectures);
router.get('/:id', getInfluencerById);
router.get('/:id/stats', getInfluencerStats);

export default router;