import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../schemas/auth';
import { 
  authRateLimit, 
  sanitizeInput,
  securityHeaders
} from '../middleware/security';
import { 
  protectFromCommandInjection,
  preventSystemCommands,
  validateFieldTypes 
} from '../middleware/command-injection-protection';

const router = Router();

// セキュリティヘッダーを全ての認証ルートに適用
router.use(securityHeaders);

// コマンドインジェクション対策を適用
router.use(protectFromCommandInjection);
router.use(preventSystemCommands);

// 入力サニタイゼーション
router.use(sanitizeInput);

// フィールドタイプ検証
const authFieldTypes = {
  email: 'email' as const,
  companyName: 'text' as const,
  contactName: 'text' as const,
  displayName: 'text' as const
};

router.post('/register', 
  authRateLimit, // レート制限
  validateFieldTypes(authFieldTypes), // フィールドタイプ検証
  validate(registerSchema), // スキーマ検証
  register
);

router.post('/login', 
  authRateLimit, // レート制限
  validateFieldTypes({ email: 'email' }), // フィールドタイプ検証
  validate(loginSchema), // スキーマ検証
  login
);

export default router;