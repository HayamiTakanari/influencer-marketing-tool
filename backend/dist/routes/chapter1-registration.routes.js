"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_chapter1_controller_1 = require("../controllers/auth-chapter1.controller");
const document_verification_controller_1 = require("../controllers/document-verification.controller");
const auth_1 = require("../middleware/auth");
const adaptive_rate_limiter_1 = __importDefault(require("../middleware/adaptive-rate-limiter"));
const router = (0, express_1.Router)();
const rateLimiter = new adaptive_rate_limiter_1.default();
// Multer設定：ファイルアップロード
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
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
router.post('/register', rateLimiter.middleware(), auth_chapter1_controller_1.registerWithEmailVerification);
// GET /api/chapter1/verify-email?token=<token>
// メールアドレス認証
router.get('/verify-email', auth_chapter1_controller_1.verifyEmail);
// POST /api/chapter1/resend-verification
// メール認証トークン再発行
// Body: { email: string }
router.post('/resend-verification', rateLimiter.middleware(), auth_chapter1_controller_1.resendVerificationEmail);
/**
 * Chapter 1-2: 本人確認書類アップロード
 */
// POST /api/chapter1/documents/upload
// 本人確認書類をアップロード
// MultipartForm: {
//   documentType: "BUSINESS_REGISTRATION" | "ID_DOCUMENT" | "INVOICE_DOCUMENT"
//   file: File (PDF/JPG/PNG、10MB以下)
// }
router.post('/documents/upload', auth_1.authenticate, rateLimiter.middleware(), upload.single('file'), document_verification_controller_1.uploadDocument);
// GET /api/chapter1/documents/status
// 本人確認書類の状態確認
// Query: { documentType?: string }
router.get('/documents/status', auth_1.authenticate, document_verification_controller_1.getDocumentStatus);
/**
 * Chapter 1: 登録進捗確認
 */
// GET /api/chapter1/registration-status
// 登録進捗状況の確認
router.get('/registration-status', auth_1.authenticate, auth_chapter1_controller_1.getRegistrationStatus);
/**
 * Chapter 1-2: 管理者機能（書類審査）
 */
// POST /api/chapter1/documents/:documentId/approve
// 本人確認書類を承認（管理者のみ）
router.post('/documents/:documentId/approve', auth_1.authenticate, document_verification_controller_1.approveDocument);
// POST /api/chapter1/documents/:documentId/reject
// 本人確認書類を却下・再提出要求（管理者のみ）
// Body: { rejectionReason: string }
router.post('/documents/:documentId/reject', auth_1.authenticate, document_verification_controller_1.rejectDocument);
/**
 * エラーハンドラー
 */
router.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
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
exports.default = router;
//# sourceMappingURL=chapter1-registration.routes.js.map