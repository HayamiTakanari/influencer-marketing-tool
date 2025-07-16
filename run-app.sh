#!/bin/bash

# 色付きの出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 インフルエンサーマーケティングツール 起動中...${NC}"
echo "=================================================="

# 既存のプロセスを終了
echo -e "${YELLOW}🔄 既存のプロセスを終了中...${NC}"
pkill -f "tsx.*src/index.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# PostgreSQL確認
if ! pgrep -x "postgres" > /dev/null; then
    echo -e "${RED}❌ PostgreSQLが起動していません${NC}"
    echo "以下のコマンドで起動してください:"
    echo "brew services start postgresql"
    exit 1
fi

# バックエンド起動
echo -e "${BLUE}🔧 バックエンドを起動中...${NC}"
cd /Users/takanari/influencer-marketing-tool/backend
npm run dev &
BACKEND_PID=$!

# バックエンドの起動を待つ
echo -e "${YELLOW}⏳ バックエンドの起動を待機中...${NC}"
sleep 5

# バックエンドの接続確認
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ バックエンドが起動しました (ポート5002)${NC}"
else
    echo -e "${RED}❌ バックエンドの起動に失敗しました${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# フロントエンド起動
echo -e "${BLUE}🎨 フロントエンドを起動中...${NC}"
cd /Users/takanari/influencer-marketing-tool/frontend
npm run dev &
FRONTEND_PID=$!

# フロントエンドの起動を待つ
echo -e "${YELLOW}⏳ フロントエンドの起動を待機中...${NC}"
sleep 8

# フロントエンドの接続確認
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ フロントエンドが起動しました (ポート3000)${NC}"
    PORT=3000
elif curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ フロントエンドが起動しました (ポート3001)${NC}"
    PORT=3001
else
    echo -e "${RED}❌ フロントエンドの起動に失敗しました${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 アプリケーションが正常に起動しました！${NC}"
echo ""
echo -e "${BLUE}📱 アクセス情報:${NC}"
echo -e "   フロントエンド: ${GREEN}http://localhost:${PORT}${NC}"
echo -e "   バックエンドAPI: ${GREEN}http://localhost:5002${NC}"
echo ""
echo -e "${BLUE}🔑 初回利用手順:${NC}"
echo "1. ブラウザで http://localhost:${PORT} にアクセス"
echo "2. 右上の「新規登録」をクリック"
echo "3. インフルエンサー または クライアント を選択"
echo "4. 必要な情報を入力してアカウント作成"
echo ""
echo -e "${YELLOW}💡 ヒント: Ctrl+C でアプリケーションを停止できます${NC}"
echo ""

# プロセスの監視
trap 'echo -e "\n${YELLOW}🔄 アプリケーションを停止中...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 無限ループでプロセスを維持
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ バックエンドが停止しました${NC}"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ フロントエンドが停止しました${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 5
done