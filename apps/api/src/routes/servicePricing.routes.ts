import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createServicePricing,
  bulkCreateServicePricing,
  getMyServicePricing,
  getServicePricingByInfluencer,
  updateServicePricing,
  deleteServicePricing,
  validateServicePricing,
} from '../controllers/servicePricing.controller';

const router = Router();

// v3.0 新機能: 料金体系管理ルート

// 料金設定作成
router.post('/', authenticate, createServicePricing);

// 料金設定一括作成
router.post('/bulk', authenticate, bulkCreateServicePricing);

// 自分の料金設定一覧取得
router.get('/my-pricing', authenticate, getMyServicePricing);

// 料金設定バリデーション
router.get('/validate', authenticate, validateServicePricing);

// 特定インフルエンサーの料金設定取得（公開情報）
router.get('/influencer/:influencerId', getServicePricingByInfluencer);

// 料金設定更新
router.put('/:id', authenticate, updateServicePricing);

// 料金設定削除
router.delete('/:id', authenticate, deleteServicePricing);

export default router;