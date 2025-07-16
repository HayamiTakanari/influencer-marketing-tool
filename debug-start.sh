#!/bin/bash

echo "🔍 デバッグ起動スクリプト"
echo "========================"

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 現在のディレクトリ確認
echo -e "${BLUE}現在のディレクトリ: $(pwd)${NC}"

# PostgreSQL確認
echo -e "${BLUE}PostgreSQL確認:${NC}"
if pgrep -x "postgres" > /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
fi

# ポート確認
echo -e "${BLUE}ポート確認:${NC}"
lsof -i :3000 -i :3001 -i :5002 || echo "対象ポートは空いています"

# バックエンドディレクトリ確認
echo -e "${BLUE}バックエンドディレクトリ確認:${NC}"
cd /Users/takanari/influencer-marketing-tool/backend
ls -la
echo "package.json存在確認:"
ls -la package.json

# 環境変数確認
echo -e "${BLUE}環境変数確認:${NC}"
echo "DATABASE_URL exists: $(grep -q DATABASE_URL .env && echo "Yes" || echo "No")"
echo "JWT_SECRET exists: $(grep -q JWT_SECRET .env && echo "Yes" || echo "No")"

# Node.js バージョン確認
echo -e "${BLUE}Node.js バージョン:${NC}"
node -v
npm -v

# 依存関係確認
echo -e "${BLUE}依存関係確認:${NC}"
npm ls date-fns 2>/dev/null || echo "date-fns not found"

# Prisma確認
echo -e "${BLUE}Prisma確認:${NC}"
npx prisma --version

# 手動でバックエンド起動
echo -e "${YELLOW}バックエンドを手動起動します...${NC}"
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

sleep 5

# バックエンドのプロセス確認
echo -e "${BLUE}バックエンドプロセス確認:${NC}"
ps -p $BACKEND_PID || echo "Backend process not found"

# 手動でフロントエンド起動
echo -e "${YELLOW}フロントエンドを手動起動します...${NC}"
cd /Users/takanari/influencer-marketing-tool/frontend

# フロントエンドディレクトリ確認
echo -e "${BLUE}フロントエンドディレクトリ確認:${NC}"
ls -la
echo "package.json存在確認:"
ls -la package.json

# 環境変数確認
echo -e "${BLUE}フロントエンド環境変数確認:${NC}"
echo "API_URL exists: $(grep -q NEXT_PUBLIC_API_URL .env.local && echo "Yes" || echo "No")"

echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

sleep 8

# フロントエンドのプロセス確認
echo -e "${BLUE}フロントエンドプロセス確認:${NC}"
ps -p $FRONTEND_PID || echo "Frontend process not found"

# 接続テスト
echo -e "${BLUE}接続テスト:${NC}"
echo "Testing localhost:3000..."
curl -s -I http://localhost:3000 | head -1 || echo "Failed to connect to port 3000"

echo "Testing localhost:3001..."
curl -s -I http://localhost:3001 | head -1 || echo "Failed to connect to port 3001"

echo "Testing localhost:5002..."
curl -s -I http://localhost:5002 | head -1 || echo "Failed to connect to port 5002"

echo -e "${GREEN}デバッグ完了${NC}"
echo "プロセスID: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"