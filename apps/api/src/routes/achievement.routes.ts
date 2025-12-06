import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createAchievement,
  getMyAchievements,
  getAchievementsByInfluencer,
  updateAchievement,
  deleteAchievement,
  getAchievementStats,
} from '../controllers/achievement.controller';

const router = Router();

// v3.0 新機能: 実績管理ルート

// 実績作成
router.post('/', authenticate, createAchievement);

// 自分の実績一覧取得
router.get('/my-achievements', authenticate, getMyAchievements);

// 実績統計取得
router.get('/stats', authenticate, getAchievementStats);

// 特定インフルエンサーの実績一覧取得（公開情報）
router.get('/influencer/:influencerId', getAchievementsByInfluencer);

// 実績更新
router.put('/:id', authenticate, updateAchievement);

// 実績削除
router.delete('/:id', authenticate, deleteAchievement);

export default router;