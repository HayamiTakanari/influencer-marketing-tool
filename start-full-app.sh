#!/bin/bash

echo "🚀 インフルエンサーマーケティングツール - フル機能版起動"
echo "==============================================="

# バックエンドを起動
echo "📡 バックエンドサーバーを起動中..."
cd /Users/takanari/influencer-marketing-tool/backend
npx tsx src/index-minimal.ts &
BACKEND_PID=$!

sleep 3

# フロントエンドを起動
echo "🖥️  フロントエンドサーバーを起動中..."
cd /Users/takanari/influencer-marketing-tool/frontend
PORT=3003 npm run dev &
FRONTEND_PID=$!

sleep 5

echo ""
echo "✅ サーバー起動完了！"
echo "🌐 フロントエンド: http://localhost:3003"
echo "🔧 バックエンドAPI: http://localhost:5002"
echo ""
echo "📝 テストアカウント:"
echo "   企業: company@test.com / test123"
echo "   インフルエンサー: influencer@test.com / test123"
echo ""
echo "Ctrl+C で全サーバーを停止"

# サーバーが停止するまで待機
trap "echo '🛑 サーバーを停止中...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait