# エラーハンドリング統一 - 移行ガイド

## 概要
このプロジェクトでは、一貫したエラーハンドリングを実現するための統一システムを導入しました。

## 新しいエラーハンドリングシステム

### 主要コンポーネント

1. **ErrorContext** (`/contexts/ErrorContext.tsx`)
   - グローバルエラー状態管理
   - トースト通知システム

2. **ErrorToast** (`/components/common/ErrorToast.tsx`)
   - エラーメッセージの視覚的表示
   - 自動消去機能

3. **useErrorHandler** (`/hooks/useErrorHandler.ts`)
   - エラー処理用カスタムフック
   - 統一されたエラーハンドリングAPI

4. **errorMessages** (`/utils/errorMessages.ts`)
   - 標準化されたエラーメッセージ
   - コンテキスト別エラーメッセージ

5. **ErrorBoundary** (`/components/common/ErrorBoundary.tsx`)
   - React エラーバウンダリー
   - Sentry統合

## 使用方法

### 基本的な使い方

```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleSuccess } = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      handleSuccess('データの取得に成功しました');
    } catch (error) {
      handleError(error, 'データの取得');
    }
  };
};
```

### 旧パターンからの移行

#### Before (旧パターン)
```tsx
try {
  await someAsyncFunction();
  alert('成功しました！');
} catch (err: any) {
  console.error('Error:', err);
  setError('エラーが発生しました');
}
```

#### After (新パターン)
```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

const { handleError, handleSuccess } = useErrorHandler();

try {
  await someAsyncFunction();
  handleSuccess('成功しました！');
} catch (err: any) {
  handleError(err, '操作');
}
```

### 非同期処理の簡略化

```tsx
const { asyncHandler } = useErrorHandler();

const handleSubmit = asyncHandler(
  async () => {
    await api.submitData(data);
  },
  'データの送信',
  'データを送信しました'
);
```

## エラーメッセージのカスタマイズ

`/utils/errorMessages.ts` に標準エラーメッセージを定義：

```typescript
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'データの取得に失敗しました。',
  SAVE_FAILED: '保存に失敗しました。',
  // ... 他のメッセージ
};
```

## 移行済みファイル

- ✅ `/pages/applications.tsx`
- ✅ `/pages/login.tsx`
- ✅ `/pages/dashboard.tsx`

## 未移行ファイル (要対応)

以下のファイルで旧パターンのエラーハンドリングが残っています：

- `/pages/profile.tsx` (17 catch blocks)
- `/pages/team-management.tsx` (7 catch blocks)
- `/pages/invoices/create.tsx` (6 catch blocks)
- `/pages/register.tsx` (9 setError calls)
- `/pages/service-pricing.tsx` (5 setError calls)
- ... 他多数

## 推奨移行手順

1. **useErrorHandler をインポート**
   ```tsx
   import { useErrorHandler } from '../hooks/useErrorHandler';
   ```

2. **フックを初期化**
   ```tsx
   const { handleError, handleSuccess } = useErrorHandler();
   ```

3. **catch ブロックを更新**
   ```tsx
   // 旧: console.error + setError
   catch (err: any) {
     console.error('Error:', err);
     setError('エラーメッセージ');
   }

   // 新: handleError
   catch (err: any) {
     handleError(err, 'コンテキスト');
   }
   ```

4. **alert を handleSuccess に置換**
   ```tsx
   // 旧: alert
   alert('成功しました！');

   // 新: handleSuccess
   handleSuccess('成功しました！');
   ```

## 注意事項

- `setError` は引き続きローカル表示用に使用可能
- `handleError` はトースト通知用
- 両方を併用することも可能

## テスト

エラーハンドリングが正しく動作することを確認：

1. ネットワークエラー発生時
2. 認証エラー発生時
3. バリデーションエラー発生時
4. 成功メッセージ表示時

## 参考

- ErrorContext: グローバル状態管理
- ErrorToast: UI表示
- useErrorHandler: ビジネスロジック
- errorMessages: メッセージ定義
