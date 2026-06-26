#!/bin/bash
# Start development environment

echo "Starting zakapp development environment..."

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

# Handle cleanup on exit
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
