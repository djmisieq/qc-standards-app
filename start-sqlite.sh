#!/bin/bash

# QC Standards App - Alternative SQLite Startup for Codespaces
# Use this when PostgreSQL Docker has issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting QC Standards App with SQLite (Docker-free)${NC}"
echo "=================================================="

# Navigate to project directory
cd /workspaces/qc-standards-app

# Function to check if a process is running
is_process_running() {
    local port=$1
    lsof -ti:$port >/dev/null 2>&1
}

# Stop any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
if is_process_running 8000; then
    echo "Stopping existing backend process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

if is_process_running 5173; then
    echo "Stopping existing frontend process..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# Create SQLite .env configuration
echo -e "${YELLOW}📄 Creating SQLite configuration...${NC}"
cat > .env << EOF
# SQLite configuration (no Docker needed)
DATABASE_URL=sqlite:///./qc_standards.db
DEBUG=True
SECRET_KEY=devkey-codespaces-2024
BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://*.githubpreview.dev,https://*.github.dev
ENVIRONMENT=development

# Redis disabled for SQLite mode
REDIS_URL=

# JWT Authentication
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# File upload settings
MAX_UPLOAD_SIZE=10485760

# Frontend settings  
VITE_API_URL=http://localhost:8000/api/v1
EOF

echo -e "${GREEN}✅ Created SQLite configuration${NC}"

# Start backend with SQLite
echo -e "${YELLOW}🔧 Starting FastAPI backend with SQLite...${NC}"
cd backend

# Install dependencies if needed
if [ ! -f ".deps_installed" ]; then
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    touch .deps_installed
fi

# Start backend
echo "Starting backend on port 8000..."
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Start frontend
echo -e "${YELLOW}⚛️  Starting React frontend...${NC}"
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install
fi

# Start frontend
echo "Starting frontend on port 5173..."
nohup npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check backend
echo -e "${YELLOW}🔍 Checking backend health...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1 || curl -s http://localhost:8000/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend health check failed. Check logs: tail -f /tmp/backend.log${NC}"
        exit 1
    fi
    sleep 2
done

# Check frontend
echo -e "${YELLOW}🔍 Checking frontend health...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173/ >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend health check failed. Check logs: tail -f /tmp/frontend.log${NC}"
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 QC Standards App is running with SQLite! (No Docker needed)${NC}"
echo "=================================================="
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/api/docs"
echo "   Database:     SQLite file: ./backend/qc_standards.db"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "   Backend:      tail -f /tmp/backend.log"
echo "   Frontend:     tail -f /tmp/frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop services:${NC}"
echo "   Kill processes: lsof -ti:8000,5173 | xargs kill -9"
echo ""
echo -e "${GREEN}✨ Access your app through the forwarded ports in VS Code!${NC}"
echo -e "${YELLOW}💡 This version uses SQLite instead of PostgreSQL for better Codespaces compatibility${NC}"
echo ""