#!/bin/bash

echo "========================================"
echo "Parkinson's Assessment App - Startup"
echo "========================================"
echo ""

echo "Starting Backend Server..."
cd backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!

sleep 3

echo "Starting Frontend Development Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Both servers are running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
