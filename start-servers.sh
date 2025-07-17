#!/bin/bash

# Start backend server
echo "Starting backend server..."
cd /Users/takanari/influencer-marketing-tool/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd /Users/takanari/influencer-marketing-tool/frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo ""
echo "🚀 Servers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait