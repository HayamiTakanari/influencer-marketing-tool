#!/bin/bash

echo "🚀 インフルエンサーマーケティングツール - ローカル起動スクリプト"
echo "=================================================="

# 色付きの出力のための定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# データベース存在確認
echo -e "${BLUE}📋 データベースの確認中...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQLがインストールされていません${NC}"
    echo "PostgreSQLをインストールしてください:"
    echo "brew install postgresql (Mac)"
    echo "sudo apt-get install postgresql (Ubuntu)"
    exit 1
fi

# データベース作成（存在しない場合）
if ! psql -lqt | cut -d \| -f 1 | grep -qw influencer_marketing; then
    echo -e "${YELLOW}📋 データベースを作成中...${NC}"
    createdb influencer_marketing
    echo -e "${GREEN}✅ データベース 'influencer_marketing' を作成しました${NC}"
else
    echo -e "${GREEN}✅ データベース 'influencer_marketing' が存在します${NC}"
fi

# バックエンドのセットアップ
echo -e "${BLUE}🔧 バックエンドをセットアップ中...${NC}"
cd backend

# 環境変数ファイル作成
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 環境変数ファイルを作成中...${NC}"
    cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/influencer_marketing"
JWT_SECRET="your-secret-key-12345"
PORT=5002
FRONTEND_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✅ .env ファイルを作成しました${NC}"
fi

# 依存関係インストール
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 バックエンドの依存関係をインストール中...${NC}"
    npm install
fi

# Prismaセットアップ
echo -e "${YELLOW}🗄️  データベーススキーマを設定中...${NC}"
npx prisma generate
npx prisma db push

# フロントエンドのセットアップ
echo -e "${BLUE}🔧 フロントエンドをセットアップ中...${NC}"
cd ../frontend

# 環境変数ファイル作成
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 フロントエンド環境変数ファイルを作成中...${NC}"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_WS_URL=http://localhost:5002
EOF
    echo -e "${GREEN}✅ .env.local ファイルを作成しました${NC}"
fi

# 依存関係インストール
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 フロントエンドの依存関係をインストール中...${NC}"
    npm install
fi

echo -e "${GREEN}🎉 セットアップ完了！${NC}"
echo ""
echo -e "${BLUE}📋 起動手順:${NC}"
echo "1. 新しいターミナルでバックエンドを起動:"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "2. 別のターミナルでフロントエンドを起動:"
echo -e "   ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "3. ブラウザでアクセス:"
echo -e "   ${GREEN}http://localhost:3000${NC} または ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}💡 初回利用時は新規登録からアカウントを作成してください${NC}"