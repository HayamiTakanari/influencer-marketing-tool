#!/bin/bash

# GitHubへのアップロードスクリプト

echo "🚀 GitHubへのアップロードを開始します..."

# Gitの初期化確認
git status

# 全ファイルをステージング
echo "📁 ファイルをステージング中..."
git add .

# コミット
echo "💾 コミット中..."
git commit -m "Complete influencer marketing tool with all features including AI, chat, payments"

# リモートリポジトリを追加
echo "🔗 GitHubリポジトリに接続中..."
git remote add origin https://github.com/HayamiTakanari/influencer-marketing-tool.git

# メインブランチに変更
git branch -M main

# プッシュ
echo "📤 GitHubにアップロード中..."
git push -u origin main

echo "✅ アップロード完了！"
echo "🌐 リポジトリURL: https://github.com/HayamiTakanari/influencer-marketing-tool"