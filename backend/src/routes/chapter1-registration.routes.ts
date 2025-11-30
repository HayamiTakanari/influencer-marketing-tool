import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  registerWithEmailVerification,
  verifyEmail,
  resendVerificationEmail,
  getRegistrationStatus,
} from '../controllers/auth-chapter1.controller';
import {
  uploadDocument,
  getDocumentStatus,
  approveDocument,
  rejectDocument,
} from '../controllers/document-verification.controller';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/adaptive-rate-limiter';

const router = Router();

// Multer設定：ファイルアップロード
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

/**
 * Chapter 1-1: ユーザー登録エンドポイント
 */

// POST /api/chapter1/register
// 企業またはインフルエンサーを登録
// Body: {
//   email: string
//   password: string (8文字以上、大文字・小文字・数字を含む)
//   role: "COMPANY" | "INFLUENCER"
//   companyName?: string (COMPANY必須)
//   legalNumber?: string
//   representativeName?: string
//   industry?: string
//   displayName?: string (INFLUENCER必須)
// }
router.post(
  '/register',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // 15分に5回まで
  validateRequest('body'),
  registerWithEmailVerification
);

// GET /api/chapter1/verify-email?token=<token>
// メールアドレス認証
router.get('/verify-email', verifyEmail);

// POST /api/chapter1/resend-verification
// メール認証トークン再発行
// Body: { email: string }
router.post(
  '/resend-verification',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }), // 1時間に3回まで
  validateRequest('body'),
  resendVerificationEmail
);

/**
 * Chapter 1-2: 本人確認書類アップロード
 */

// POST /api/chapter1/documents/upload
// 本人確認書類をアップロード
// MultipartForm: {
//   documentType: "BUSINESS_REGISTRATION" | "ID_DOCUMENT" | "INVOICE_DOCUMENT"
//   file: File (PDF/JPG/PNG、10MB以下)
// }
router.post(
  '/documents/upload',
  authenticate,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), // 1時間に10回まで
  upload.single('file'),
  uploadDocument
);

// GET /api/chapter1/documents/status
// 本人確認書類の状態確認
// Query: { documentType?: string }
router.get('/documents/status', authenticate, getDocumentStatus);

/**
 * Chapter 1: 登録進捗確認
 */

// GET /api/chapter1/registration-status
// 登録進捗状況の確認
router.get('/registration-status', authenticate, getRegistrationStatus);

/**
 * Chapter 1-2: 管理者機能（書類審査）
 */

// POST /api/chapter1/documents/:documentId/approve
// 本人確認書類を承認（管理者のみ）
router.post('/documents/:documentId/approve', authenticate, approveDocument);

// POST /api/chapter1/documents/:documentId/reject
// 本人確認書類を却下・再提出要求（管理者のみ）
// Body: { rejectionReason: string }
router.post('/documents/:documentId/reject', authenticate, validateRequest('body'), rejectDocument);

/**
 * エラーハンドラー
 */
router.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 10MB' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }

  if (err.message === 'Invalid file type') {
    return res.status(400).json({ error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' });
  }

  console.error('Chapter 1 route error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;
