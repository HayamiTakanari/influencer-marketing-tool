# セキュリティ実装ドキュメント

## 概要
このドキュメントでは、インフルエンサーマーケティングツールのバックエンドに実装されたセキュリティ対策について説明します。

## 実装されたセキュリティ対策

### 1. SQLインジェクション対策

#### 既存の対策
- **Prisma ORM**: パラメータ化クエリを自動的に使用
- **トランザクション**: データ整合性を確保
- **入力検証**: Zodスキーマによる厳密な検証

#### 追加実装
```typescript
// 強化されたバリデーションスキーマ
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .refine((email) => {
      const dangerousPatterns = [/'|"|\\|;|--|\/\*|\*\//];
      return !dangerousPatterns.some(pattern => 
        typeof pattern === 'string' ? email.includes(pattern) : pattern.test(email)
      );
    }, 'Email contains invalid characters'),
  // ...
});
```

### 2. データベースアップロード権限制限

#### ロール別権限設定
- **CLIENT**: 読み取りのみ、自分のデータのみアクセス可能
- **INFLUENCER**: 自分のプロフィール・ポートフォリオの更新可能
- **ADMIN**: 全データへのアクセス可能

#### 実装方法
```typescript
export const checkDatabasePermissions = (requiredRole: string[] = ['ADMIN']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user || !requiredRole.includes(user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions for database operations'
      });
      return;
    }
    next();
  };
};
```

### 3. データベース容量制限

#### ロール別容量制限
- **CLIENT**: 100MB
- **INFLUENCER**: 500MB  
- **ADMIN**: 2GB

#### ファイル数制限
- **CLIENT**: 50ファイル
- **INFLUENCER**: 200ファイル
- **ADMIN**: 1000ファイル

#### 実装詳細
```typescript
export const STORAGE_QUOTAS = {
  CLIENT: 100 * 1024 * 1024, // 100MB
  INFLUENCER: 500 * 1024 * 1024, // 500MB
  ADMIN: 2 * 1024 * 1024 * 1024, // 2GB
} as const;

// 容量チェック機能
export async function checkStorageAvailability(
  userId: string,
  fileSize: number,
  additionalFiles: number = 1
): Promise<{ allowed: boolean; reason?: string; quota: StorageQuota }>
```

### 4. ユーザー入力とシステム命令の分離

#### コマンドインジェクション対策
```typescript
const DANGEROUS_COMMAND_PATTERNS = [
  // System commands
  /(\b(rm|del|delete|format|shutdown|reboot|kill|ps|curl|wget|ssh)\b)/i,
  // Shell operators  
  /[;&|`$(){}[\]\\]/,
  // Path traversal
  /\.\.(\/|\\)/,
  // SQL injection patterns
  /(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\s+/i,
];
```

#### 入力サニタイゼーション
- HTMLタグの除去
- 危険な文字列のエスケープ
- XSS攻撃対策
- パストラバーサル対策

#### ホワイトリスト方式の検証
```typescript
const SAFE_PATTERNS = {
  text: /^[\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u002B\u002D\u002E]*$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  filename: /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]{1,10}$/,
};
```

### 5. セキュリティミドルウェア

#### レート制限
- **一般API**: 15分間に100リクエスト
- **認証API**: 15分間に5リクエスト  
- **ファイルアップロード**: 1時間に10リクエスト

#### セキュリティヘッダー
```typescript
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

#### ファイルアップロード制限
- **ファイルサイズ**: 50MB以下
- **ファイル形式**: 画像・動画のみ許可
- **同時アップロード**: 5ファイルまで

### 6. ログとモニタリング

#### セキュリティログ
```typescript
// 認証失敗のログ
console.warn(`Failed login attempt for email: ${email} from IP: ${clientIP}`);

// セキュリティ違反のログ  
console.warn(`Security violation from IP: ${req.ip} - ${err.message}`);

// 成功ログ
console.log(`Successful login: ${user.id} (${user.email}) from IP: ${clientIP}`);
```

## 設定方法

### 1. 環境変数
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secure-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. 必要な依存関係
```bash
npm install express-rate-limit helmet multer @types/multer zod bcryptjs jsonwebtoken
```

### 3. ミドルウェアの適用順序
```typescript
// 1. セキュリティヘッダー
app.use(securityHeaders);

// 2. コマンドインジェクション対策
app.use(protectFromCommandInjection);
app.use(preventSystemCommands);

// 3. CORS設定
app.use(cors({...}));

// 4. JSON parsing with limits
app.use(express.json({ limit: '10mb' }));

// 5. レート制限
app.use(generalRateLimit);

// 6. ルート定義
app.use('/api/auth', authRoutes);
```

## セキュリティベストプラクティス

### 1. パスワードセキュリティ
- 最小8文字
- 大文字・小文字・数字・特殊文字を含む
- bcryptでハッシュ化（ラウンド数: 12）

### 2. JWTトークン
- 短い有効期限（1時間推奨）
- リフレッシュトークンの実装
- 秘密鍵の定期的な更新

### 3. データベース
- 最小権限の原則
- 定期的なバックアップ
- 暗号化の実装

### 4. ファイルアップロード
- ウイルススキャンの実装（推奨）
- CDN経由での配信
- 古いファイルの自動削除

## モニタリングと対応

### 1. アラート設定
- 異常なリクエスト数
- 認証失敗の急増
- ストレージ容量の枯渇

### 2. 定期的なセキュリティチェック
- 依存関係の脆弱性スキャン
- ペネトレーションテスト
- ログの分析

### 3. インシデント対応
- セキュリティ違反の検知時の手順
- ユーザーへの通知方法
- システムの緊急停止手順

## 今後の改善予定

1. **Web Application Firewall (WAF)** の導入
2. **2要素認証 (2FA)** の実装
3. **API キー管理システム** の構築
4. **ログ分析システム** の強化
5. **自動セキュリティテスト** の実装

---

このセキュリティ実装により、一般的なWeb攻撃（SQLインジェクション、XSS、CSRF、コマンドインジェクション等）に対する基本的な防御が確立されています。