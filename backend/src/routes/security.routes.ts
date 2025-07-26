import { Router } from 'express';
import { handleCSPReport, handleXSSAttempt, getSecurityStats } from '../controllers/security.controller';
import { generalRateLimit, authRateLimit } from '../middleware/security';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// CSP違反レポートエンドポイント（認証不要、レート制限あり）
router.post('/csp-report', 
  generalRateLimit,
  handleCSPReport
);

// XSS攻撃試行レポートエンドポイント（認証不要、レート制限あり）
router.post('/xss-attempt',
  authRateLimit, // より厳しいレート制限
  handleXSSAttempt
);

// セキュリティ統計情報（管理者のみ）
router.get('/stats',
  authenticateToken,
  getSecurityStats
);

export default router;