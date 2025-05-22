#!/bin/bash

# QC Standards App - Development Startup Script
# This script starts all services needed for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting QC Standards App Development Environment${NC}"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Check if required commands exist
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Start database services
echo -e "${YELLOW}🐘 Starting database services...${NC}"
docker-compose -f docker-compose.dev.yml up -d db redis

# Wait for services to be ready
wait_for_service "PostgreSQL" "localhost" "5432"
wait_for_service "Redis" "localhost" "6379"

# Install backend dependencies if not already installed
if [ ! -d "backend/venv" ] && [ ! -f "backend/.deps_installed" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    pip install -r requirements.txt
    touch .deps_installed
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Install frontend dependencies if not already installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Function to start backend in background
start_backend() {
    echo -e "${YELLOW}🔧 Starting FastAPI backend...${NC}"
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
}

# Function to start frontend in background
start_frontend() {
    echo -e "${YELLOW}⚛️  Starting React frontend...${NC}"
    cd frontend
    npm run dev -- --host 0.0.0.0 --port 5173 &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
}

# Start services
start_backend
sleep 3
start_frontend

# Wait a moment for services to initialize
sleep 5

# Display service information
echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo "=================================================="
echo -e "${YELLOW}🌐 Service URLs:${NC}"
echo "   Frontend:     http://localhost:5173"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/api/docs"
echo "   Database:     postgresql://postgres:password@localhost:5432/qc_standards"
echo "   Redis:        redis://localhost:6379"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "   View logs:           docker-compose -f docker-compose.dev.yml logs"
echo "   Stop databases:      docker-compose -f docker-compose.dev.yml down"
echo "   Restart everything:  ./start-dev.sh"
echo ""
echo -e "${GREEN}💡 Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    docker-compose -f docker-compose.dev.yml down
    echo -e "${GREEN}✅ Database services stopped${NC}"
    
    echo -e "${GREEN}👋 Goodbye!${NC}"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Keep script running and show logs
echo -e "${YELLOW}📊 Showing live logs (Press Ctrl+C to stop):${NC}"
echo "=================================================="

# Wait for user interruption
wait