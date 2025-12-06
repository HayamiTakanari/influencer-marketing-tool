import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createProjectSchedule,
  getProjectSchedule,
  updateMilestone,
  getUpcomingMilestones,
  sendMilestoneNotifications,
} from '../controllers/schedule.controller';

const router = Router();

// v3.0 新機能: スケジュール管理ルート

// プロジェクトスケジュール作成
router.post('/', authenticate, createProjectSchedule);

// 今後のマイルストーン取得
router.get('/upcoming', authenticate, getUpcomingMilestones);

// マイルストーン通知送信（システム用）
router.post('/notifications', sendMilestoneNotifications);

// プロジェクトスケジュール取得
router.get('/project/:projectId', authenticate, getProjectSchedule);

// マイルストーン更新
router.put('/milestone/:id', authenticate, updateMilestone);

export default router;