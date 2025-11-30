# API レスポンス標準化ガイド

本番開発での API レスポンス形式を統一するためのドキュメント。

## 概要

すべての API エンドポイントは統一されたレスポンス形式を返す必要があります。これにより、フロントエンド開発の効率化とエラーハンドリングの一貫性が実現されます。

## レスポンス形式

### 成功レスポンス（2xx）

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    // レスポンスデータ
  },
  "timestamp": "2025-11-30T08:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### エラーレスポンス（4xx/5xx）

```json
{
  "success": false,
  "statusCode": 401,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token",
    "details": {
      // オプション：詳細情報
    }
  },
  "timestamp": "2025-11-30T08:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## ステータスコード一覧

| コード | Error Code | 説明 | 例 |
|--------|-----------|------|-----|
| 200 | OK | リクエスト成功 | `GET /api/user` |
| 201 | CREATED | リソース作成成功 | `POST /api/projects` |
| 400 | VALIDATION_ERROR | 入力値の検証失敗 | `POST /api/projects` (必須フィールド不足) |
| 401 | UNAUTHORIZED | 認証失敗・トークンなし | `GET /api/dashboard` (トークンなし) |
| 403 | FORBIDDEN | 権限不足 | `GET /api/admin` (ADMIN以外) |
| 404 | NOT_FOUND | リソースが見つからない | `GET /api/user/invalid-id` |
| 409 | CONFLICT | リソース重複 | `POST /api/auth/register` (メール重複) |
| 500 | INTERNAL_ERROR | サーバーエラー | データベース接続エラー |

## 使用方法

### コントローラーでの実装例

```typescript
import { sendSuccess, sendValidationError, sendNotFound, sendInternalError } from '../utils/api-response';
import { AuthRequest } from '../middleware/auth';

export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // バリデーション
    if (!userId || userId.length === 0) {
      sendValidationError(res, 'User ID is required', undefined, req.requestId);
      return;
    }

    // データベースクエリ
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      sendNotFound(res, `User not found: ${userId}`, req.requestId);
      return;
    }

    // 成功レスポンス
    sendSuccess(res, user, 'User fetched successfully', 200, req.requestId);
  } catch (error) {
    console.error('Error fetching user:', error);
    sendInternalError(res, 'Failed to fetch user', undefined, req.requestId);
  }
};
```

### 認証ミドルウェアでの実装

```typescript
import { sendUnauthorized, sendForbidden } from '../utils/api-response';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided', req.requestId);
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    sendUnauthorized(res, 'Invalid token', req.requestId);
  }
};
```

## ベストプラクティス

### 1. エラーコードの統一

アプリケーション全体で一貫したエラーコードを使用してください：
- `UNAUTHORIZED`: 認証失敗（401）
- `FORBIDDEN`: 権限不足（403）
- `NOT_FOUND`: リソース見つからず（404）
- `VALIDATION_ERROR`: バリデーション失敗（400）
- `INTERNAL_ERROR`: サーバーエラー（500）

### 2. メッセージの明確性

ユーザーにとって有用なエラーメッセージを提供してください：

❌ 悪い例：
```json
{
  "error": {
    "code": "ERROR",
    "message": "Error occurred"
  }
}
```

✅ 良い例：
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid",
    "details": {
      "field": "email",
      "received": "invalid-email"
    }
  }
}
```

### 3. 機密情報の除外

レスポンスには機密情報を含めないこと：

❌ 悪い例：
```json
{
  "error": {
    "message": "Database password mismatch"
  }
}
```

✅ 良い例：
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

### 4. Request ID の活用

すべてのレスポンスに `requestId` を含め、ログとの関連付けに使用：

```bash
# ログでリクエストを追跡
grep "550e8400-e29b-41d4-a716-446655440000" /var/log/app.log
```

## レスポンス形式の移行

既存のエンドポイントを新しい形式に移行する際の手順：

1. **モジュール の import**：
   ```typescript
   import { sendSuccess, sendError } from '../utils/api-response';
   ```

2. **レスポンス呼び出しの置き換え**：
   ```typescript
   // Before
   res.status(200).json({ data: user });

   // After
   sendSuccess(res, user, 'User fetched successfully', 200, req.requestId);
   ```

3. **エラーレスポンスの統一**：
   ```typescript
   // Before
   res.status(401).json({ error: 'Unauthorized' });

   // After
   sendUnauthorized(res, 'Unauthorized', req.requestId);
   ```

## フロントエンド での処理例

フロントエンドでは統一されたレスポンス形式で処理：

```typescript
// services/api.ts
async function apiCall<T>(method: string, url: string, data?: any): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const json = await response.json();

  if (!json.success) {
    // エラー処理
    const errorCode = json.error?.code;
    const errorMessage = json.error?.message;

    if (errorCode === 'UNAUTHORIZED') {
      // 認証エラー処理
      redirectToLogin();
    } else if (errorCode === 'FORBIDDEN') {
      // 権限エラー処理
      showAccessDenied();
    }

    throw new Error(errorMessage);
  }

  return json.data;
}
```

## 参考リンク

- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [RESTful API Design Best Practices](https://restfulapi.net/)

---

**最終更新**: 2025-11-30
**担当者**: System
**重要度**: ⚠️ 本番開発での必須ドキュメント
