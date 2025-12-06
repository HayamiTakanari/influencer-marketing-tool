import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBulkInquiry,
  getMyBulkInquiries,
  getMyInquiryResponses,
  updateInquiryResponse,
  getBulkInquiryById,
  getInquiryStats,
} from '../controllers/bulkInquiry.controller';

const router = Router();

// v3.0 新機能: 一斉問い合わせルート

// 一斉問い合わせ作成
router.post('/', authenticate, createBulkInquiry);

// 自分の問い合わせ一覧取得（クライアント用）
router.get('/my-inquiries', authenticate, getMyBulkInquiries);

// 自分への問い合わせ一覧取得（インフルエンサー用）
router.get('/my-responses', authenticate, getMyInquiryResponses);

// 問い合わせ統計取得
router.get('/stats', authenticate, getInquiryStats);

// 問い合わせ詳細取得
router.get('/:id', authenticate, getBulkInquiryById);

// 問い合わせ回答更新
router.put('/response/:id', authenticate, updateInquiryResponse);

export default router;