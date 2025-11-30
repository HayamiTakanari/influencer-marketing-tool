# 開発ルール

本ドキュメントは、[08-workflow.md](./08-workflow.md) のワークフロー実装時の開発ガイドを定義します。

---

## プロジェクト初期設定

### 開発環境セットアップ

#### 必須ツール
```bash
# Node.js 18.x 以上
node --version

# npm 9.x 以上
npm --version

# Git
git --version

# Docker & Docker Compose（ローカル開発用）
docker --version
docker-compose --version
```

#### リポジトリクローン
```bash
git clone <repository-url>
cd influencer-marketing-tool
npm install
```

#### 環境変数設定
```bash
# .env.local ファイルを作成
cp .env.example .env.local
# 開発環境の変数を設定
```

#### データベース初期化
```bash
# PostgreSQL 起動
docker-compose up -d

# Prisma マイグレーション実行
npx prisma migrate dev --name initial

# ダミーデータ投入（開発用）
npx prisma db seed
```

---

## コーディング規約

### TypeScript

#### 型定義の厳格さ

```typescript
// Good - すべての変数に型を明示
interface User {
  id: string;
  email: string;
  role: 'COMPANY' | 'INFLUENCER' | 'ADMIN';
  createdAt: Date;
}

function getUserById(id: string): Promise<User | null> {
  // ...
}

// Bad - any の使用
function getUser(id: any): any {
  // ...
}
```

#### ジェネリクス
```typescript
// API レスポンスの型安全性
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 使用例
const response: ApiResponse<User[]> = await fetchUsers();
```

#### Null/Undefined チェック
```typescript
// Good - Optional Chaining & Nullish Coalescing
const email = user?.profile?.email ?? 'unknown@example.com';

// Good - 型ガード
function processUser(user: User | null) {
  if (!user) return;
  console.log(user.email);
}

// Bad - 文字列チェーン
const email = user && user.profile && user.profile.email ? user.profile.email : 'unknown@example.com';
```

### React コンポーネント

#### ファイル構成
```
src/
├── components/
│   ├── Common/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── Features/
│       ├── ProjectCard.tsx
│       ├── ProjectForm.tsx
│       ├── InfluencerSearch.tsx
│       └── ChatWindow.tsx
├── pages/
│   ├── projects/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── create.tsx
│   └── ...
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── ...
├── hooks/
│   ├── useUser.ts
│   ├── useProjects.ts
│   └── ...
└── utils/
    ├── validation.ts
    ├── formatters.ts
    └── ...
```

#### コンポーネント定義
```typescript
interface ProjectCardProps {
  projectId: string;
  title: string;
  budget: number;
  onSelect: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  projectId,
  title,
  budget,
  onSelect
}) => {
  const handleClick = useCallback(() => {
    onSelect(projectId);
  }, [projectId, onSelect]);

  return (
    <div onClick={handleClick}>
      <h3>{title}</h3>
      <p>¥{budget.toLocaleString()}</p>
    </div>
  );
};

export default React.memo(ProjectCard);
```

#### Hooks の正しい使用
```typescript
// Custom Hook - ロジック分離
function useProjects(filters: ProjectFilters) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProjects(filters)
      .then(setProjects)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters]);

  return { projects, loading, error };
}

// useCallback - 関数メモ化
const handleApply = useCallback(async (projectId: string) => {
  await applyToProject(projectId);
  refreshApplications();
}, []);

// useMemo - 計算結果メモ化
const filteredProjects = useMemo(() => {
  return projects.filter(p => p.budget >= minBudget);
}, [projects, minBudget]);
```

### Express API

#### ディレクトリ構造
```
src/
├── controllers/
│   ├── auth.controller.ts
│   ├── projects.controller.ts
│   ├── influencers.controller.ts
│   └── ...
├── services/
│   ├── auth.service.ts
│   ├── projects.service.ts
│   ├── influencers.service.ts
│   └── ...
├── routes/
│   ├── auth.routes.ts
│   ├── projects.routes.ts
│   ├── influencers.routes.ts
│   └── ...
├── middleware/
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── ...
├── schemas/
│   ├── auth.schema.ts
│   ├── projects.schema.ts
│   └── ...
├── types/
│   ├── index.ts
│   └── ...
└── utils/
    ├── errors.ts
    ├── validators.ts
    └── ...
```

#### API エンドポイント設計
```typescript
// Good - RESTful 設計
// ワークフロー第2章：プロジェクト関連
router.get('/api/projects', ProjectController.list);
router.post('/api/projects', ProjectController.create);
router.get('/api/projects/:id', ProjectController.getById);
router.put('/api/projects/:id', ProjectController.update);
router.delete('/api/projects/:id', ProjectController.delete);
router.post('/api/projects/:id/publish', ProjectController.publish);

// ワークフロー第3章：マッチング関連
router.get('/api/influencers', InfluencerController.search);
router.get('/api/influencers/:id', InfluencerController.getById);
router.post('/api/applications', ApplicationController.create);
router.put('/api/applications/:id', ApplicationController.update);
router.post('/api/scouts', ScoutController.send);

// ワークフロー第7章：請求・支払い
router.get('/api/invoices', InvoiceController.list);
router.post('/api/invoices', InvoiceController.create);
router.post('/api/payments/process', PaymentController.process);
```

#### エラーハンドリング
```typescript
// カスタムエラークラス
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// コントローラー
async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, budget } = req.body;

    // バリデーション
    if (!title || budget < 0) {
      throw new AppError(400, 'INVALID_INPUT', '入力値が不正です');
    }

    const project = await projectService.create(req.user.id, {
      title,
      budget
    });

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

// グローバルエラーハンドラー
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // 予期しないエラー
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'システムエラーが発生しました'
    }
  });
});
```

#### ミドルウェア
```typescript
// 認証ミドルウェア
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', '認証が必要です');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// 権限チェックミドルウェア
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'アクセス権がありません');
    }
    next();
  };
};

// 使用例
router.post(
  '/api/projects',
  authMiddleware,
  requireRole(['COMPANY', 'ADMIN']),
  ProjectController.create
);
```

---

## 命名規約

### ファイル・ディレクトリ
- **PascalCase**: React コンポーネント
  - `ProjectCard.tsx`, `UserProfile.tsx`
- **kebab-case**: その他のファイル
  - `user-utils.ts`, `auth.controller.ts`, `project.routes.ts`
- **PascalCase**: ディレクトリ（コンポーネント用）
  - `components/Features/`, `pages/company/`
- **snake_case**: ディレクトリ（その他）
  - `src/services/`, `src/routes/`, `src/utils/`

### 変数・関数
- **camelCase**: 変数、関数、メソッド
  - `getUserProjects()`, `isVerified`, `handleSubmit()`
- **UPPER_SNAKE_CASE**: 定数
  - `API_BASE_URL`, `MAX_RETRIES`, `DEFAULT_TIMEOUT`
- **PascalCase**: クラス、インターフェース、型
  - `User`, `IUserService`, `ProjectStatus`

### データベース
- **snake_case**: テーブル名、カラム名
  - `users`, `user_profiles`, `created_at`, `is_verified`
- **id**: ID カラム
  - `id`, `user_id`, `project_id`

---

## テスト戦略

### ユニットテスト（Jest）

```typescript
// src/services/__tests__/projects.service.test.ts
import { projectService } from '../projects.service';

describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project with valid input', async () => {
      const result = await projectService.create('company-1', {
        title: 'New Project',
        budget: 100000
      });

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('New Project');
      expect(result.budget).toBe(100000);
    });

    it('should throw error with invalid budget', async () => {
      await expect(
        projectService.create('company-1', {
          title: 'Invalid Project',
          budget: -1000
        })
      ).rejects.toThrow('Budget must be positive');
    });
  });
});
```

### インテグレーションテスト（Supertest）

```typescript
// src/routes/__tests__/projects.integration.test.ts
import request from 'supertest';
import app from '../../app';

describe('Projects API', () => {
  describe('POST /api/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Project',
          budget: 100000
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ title: 'Test', budget: 100000 });

      expect(res.status).toBe(401);
    });
  });
});
```

### テストカバレッジ
- **目標**: 80% 以上
- **実行**: `npm run test:coverage`
- **コミット時**: 必ずテスト実行

---

## Git ワークフロー

### ブランチ戦略

#### ブランチ命名
```
main/                    # 本番環境
develop/                 # 開発環境
feature/user-auth        # 機能開発
bugfix/login-error       # バグ修正
hotfix/payment-issue     # 本番緊急修正
chore/dependencies       # 依存関係更新
```

#### ブランチ保護ルール
- **main**: Pull Request + レビュー必須 + CI Pass必須
- **develop**: Pull Request + CI Pass 必須

### コミットメッセージ

#### フォーマット
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### タイプ
- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コード整形（機能変更なし）
- **refactor**: リファクタリング
- **test**: テスト追加・変更
- **chore**: 依存パッケージ更新、ビルド設定変更

#### 例
```
feat(projects): add project creation workflow

- Implement project creation form
- Add validation for project fields
- Integrate with backend API

Closes #123
```

### Pull Request

#### PR テンプレート
```markdown
## 📋 説明
- PR の概要を 1-2 文で記載

## 🔗 関連 Issue
Closes #123

## 🧪 テスト
- [ ] ユニットテスト追加
- [ ] 手動テスト実施
- [ ] Staging 環境で動作確認

## 📸 スクリーンショット（UI変更の場合）
- Before: [画像]
- After: [画像]

## ✅ チェックリスト
- [ ] コードレビュー自己チェック済み
- [ ] ESLint、Prettier エラーなし
- [ ] テスト実行済み
- [ ] ドキュメント更新済み
```

---

## CI/CD パイプライン

### GitHub Actions

#### ワークフロー
```yaml
name: CI/CD

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - run: npm run deploy
```

### デプロイメント

#### ステージング
- **トリガー**: `develop` ブランチへの push
- **環境**: Vercel Staging
- **テスト**: E2E テスト実行
- **自動デプロイ**: Yes

#### 本番
- **トリガー**: `main` ブランチへの push（またはタグ作成）
- **環境**: Vercel Production
- **前提**: 全テスト Pass + レビュー完了
- **自動デプロイ**: Yes

---

## パフォーマンス最適化

### React パフォーマンス

#### 不要な再レンダリング回避
```typescript
// React.memo で Props 変更時のみ再レンダリング
const ProjectCard = React.memo(({ id, title }: Props) => {
  return <div>{title}</div>;
}, (prevProps, nextProps) => prevProps.id === nextProps.id);

// useCallback で関数参照の安定化
const handleClick = useCallback(() => {
  onSelect(projectId);
}, [projectId, onSelect]);

// useMemo で計算結果のメモ化
const expensiveValue = useMemo(() => {
  return computeExpensive(data);
}, [data]);
```

#### リスト最適化
```typescript
// key を確実に指定
{projects.map(project => (
  <ProjectCard key={project.id} project={project} />
))}

// 遅延ロード（Virtualization）
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={projects.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  )}
</FixedSizeList>
```

### API 最適化

#### キャッシング戦略
```typescript
// React Query でのキャッシング
import { useQuery } from '@tanstack/react-query';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
    staleTime: 5 * 60 * 1000, // 5分
    cacheTime: 10 * 60 * 1000, // 10分
  });
}
```

#### バッチ処理
```typescript
// 複数操作を 1 リクエストで処理
const applyMultiple = async (projectIds: string[]) => {
  const response = await api.post('/api/applications/batch', {
    projectIds
  });
  return response.data;
};
```

---

## セキュリティチェックリスト

### コード審査時
- [ ] 入力値バリデーション実装済み
- [ ] SQL インジェクション対策（Prisma ORM使用確認）
- [ ] XSS 対策（HTML エスケープ確認）
- [ ] CSRF トークン実装済み（POST/PUT/DELETE）
- [ ] 認証・権限チェック実装済み
- [ ] 機密情報が `.env` に記載されていないか確認
- [ ] 外部 API キー露出なし
- [ ] エラーメッセージが詳細すぎていないか
- [ ] ログに機密情報含まれていないか

### デプロイ前
- [ ] `.env` ファイル設定完了
- [ ] API キー・シークレット設定完了
- [ ] SSL 証明書設定完了
- [ ] CORS 設定確認
- [ ] レート制限設定確認
- [ ] データベース接続確認
- [ ] ログレベル本番仕様に変更

---

## よくある質問・トラブルシューティング

### データベースエラー
```
Error: ENOENT: no such file or directory, open '.env'

解決:
cp .env.example .env.local
# 環境変数を設定
```

### ポート競合
```
Error: listen EADDRINUSE: address already in use :::3000

解決:
lsof -i :3000
kill -9 <PID>
# または
PORT=3001 npm run dev
```

### ビルドエラー
```
npm run build

失敗した場合:
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## ドキュメント・ガイドの更新

このドキュメントは定期的に更新されます。変更履歴：

- **2025-11-30**: 初版作成 - ワークフロー実装ガイド完成

---

**最終更新**: 2025-11-30
**関連ドキュメント**: [08-workflow.md](./08-workflow.md)、[03-tech-stack.md](./03-tech-stack.md)、[05-security.md](./05-security.md)
