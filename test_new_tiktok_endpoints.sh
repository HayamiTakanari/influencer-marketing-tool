#!/bin/bash

echo "========================================="
echo "Testing New TikTok API Endpoints"
echo "========================================="

# Test 1: Get user info by username
echo ""
echo "Test 1: GET /api/tiktok/user/tiktok"
curl -s "http://localhost:5002/api/tiktok/user/tiktok" | jq .

# Test 2: Get user videos stats
echo ""
echo "Test 2: GET /api/tiktok/user/tiktok/videos-stats"
curl -s "http://localhost:5002/api/tiktok/user/tiktok/videos-stats?maxVideos=3" | jq .

# Test 3: Get user followers
echo ""
echo "Test 3: GET /api/tiktok/user/tiktok/followers"
curl -s "http://localhost:5002/api/tiktok/user/tiktok/followers" | jq .

# Test 4: Search videos
echo ""
echo "Test 4: GET /api/tiktok/search?keyword=dance"
curl -s "http://localhost:5002/api/tiktok/search?keyword=dance&maxResults=3" | jq .

echo ""
echo "========================================="
echo "All tests completed"
echo "========================================="
