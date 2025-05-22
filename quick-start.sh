#!/bin/bash

# QC Standards App - Quick Start Script
# Simple one-command startup for Codespaces

echo "🚀 Quick starting QC Standards App..."

# Make sure we're in the right directory
cd /workspaces/qc-standards-app

# Start databases
docker-compose -f docker-compose.dev.yml up -d

# Wait for databases
sleep 10

# Start backend in background
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Start frontend in background  
cd ../frontend
npm run dev -- --host 0.0.0.0 --port 5173 &

# Give services time to start
sleep 5

echo "✅ Services started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/api/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait