#!/bin/bash

# ローカルデータベースからダンプを作成
echo "📦 Creating database dump from local PostgreSQL..."
pg_dump -U postgres -h localhost -d influencer_marketing -F custom -f /tmp/local_db_dump.dump 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database dump created successfully"
else
    echo "❌ Failed to create database dump"
    exit 1
fi

# Supabaseに復元（注：Supabaseのダッシュボードから手動で復元することをお勧めします）
echo ""
echo "📋 Database dump is ready at: /tmp/local_db_dump.dump"
echo ""
echo "To restore to Supabase:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project (ekqvrfjpumnuuwctluum)"
echo "3. Go to SQL Editor"
echo "4. Create a new query and paste the dump content"
echo ""
echo "Or use pg_restore if you have direct database access:"
echo "pg_restore -U postgres.ekqvrfjpumnuuwctluum -h aws-0-ap-northeast-1.pooler.supabase.com -d postgres /tmp/local_db_dump.dump"
