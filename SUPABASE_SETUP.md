# Supabaseセットアップガイド

## 概要
このアプリケーションは、ローカルPostgreSQLとSupabaseの両方をサポートしています。本番環境ではSupabaseを使用してください。

## Supabase認証情報

```
URL: https://ekqvrfjpumnuuwctluum.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcXZyZmpwdW1udXV3Y3RsdXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDY2MDYsImV4cCI6MjA3NTkyMjYwNn0.knMVXwZ3F026JB1IF2R0ebSXekTEUaNBRGWeFAZLhEo
```

## セットアップステップ

### 1. 環境変数の設定

**フロントエンド (`/frontend/.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ekqvrfjpumnuuwctluum.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcXZyZmpwdW1udXV3Y3RsdXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDY2MDYsImV4cCI6MjA3NTkyMjYwNn0.knMVXwZ3F026JB1IF2R0ebSXekTEUaNBRGWeFAZLhEo
```

## フロントエンド統合

### Supabaseクライアントの初期化

`/frontend/src/lib/supabase.ts` で初期化済み

### Realtimeフックの使用

```typescript
import { useInfluencerRealtime } from '@/hooks/useInfluencerRealtime'

const { data, loading, error } = useInfluencerRealtime(influencerId)
```

## データフロー

```
Supabase Database (リアルタイムデータ)
        ↓
Frontend (useInfluencerRealtime Hook)
        ↓
Display in UI
```

## Supabaseダッシュボード

https://supabase.com/dashboard

**プロジェクトID:** ekqvrfjpumnuuwctluum

