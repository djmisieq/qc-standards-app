#!/bin/bash

# QC Standards App - Development Startup Script for Codespaces
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

# Function to check postgres directly with docker command
check_postgres() {
    local container=$1
    local max_attempts=$2
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        echo "   Attempt $attempt/$max_attempts..."
        
        if docker exec $container pg_isready -U postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
            return 0
        fi
        
        sleep 5
        ((attempt++))
    done
    
    echo -e "${RED}❌ PostgreSQL failed to start within expected time${NC}"
    return 1
}

# Function to check redis directly with docker command
check_redis() {
    local container=$1
    local max_attempts=$2
    local attempt=1

    echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        echo "   Attempt $attempt/$max_attempts..."
        
        if docker exec $container redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis is ready!${NC}"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Redis failed to start within expected time${NC}"
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
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Find container names
DB_CONTAINER=$(docker-compose -f docker-compose.dev.yml ps -q db)
REDIS_CONTAINER=$(docker-compose -f docker-compose.dev.yml ps -q redis)

echo "Database container: $DB_CONTAINER"
echo "Redis container: $REDIS_CONTAINER"

# Wait for services to be ready using direct docker commands
check_postgres $DB_CONTAINER 15
check_redis $REDIS_CONTAINER 10

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
    npm install jwt-decode react-router-dom axios swr
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Create frontend .env.local for localhost API URL
if [ ! -f "frontend/.env.local" ] || ! grep -q "localhost" "frontend/.env.local"; then
    echo -e "${YELLOW}⚙️  Creating frontend .env.local file with localhost API URL...${NC}"
    echo "VITE_API_URL=http://localhost:8000/api/v1" > frontend/.env.local
    echo -e "${GREEN}✅ frontend .env.local created for Codespaces Simple Browser${NC}"
fi

# Create logo.png if it doesn't exist
if [ ! -f "frontend/public/logo.png" ]; then
    echo -e "${YELLOW}⚙️  Creating placeholder logo.png...${NC}"
    mkdir -p frontend/public
    touch frontend/public/logo.png
    echo -e "${GREEN}✅ logo.png placeholder created${NC}"
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
echo -e "${YELLOW}🌐 Service URLs for Codespaces Simple Browser:${NC}"
echo "   Frontend: http://localhost:5173 (Click 'Ports' tab below, then the globe icon next to port 5173)"
echo "   Backend API: http://localhost:8000 (Click 'Ports' tab below, then the globe icon next to port 8000)"
echo "   API Docs: http://localhost:8000/api/docs"
echo "   Database: postgresql://postgres:password@localhost:5432/qc_standards"
echo "   Redis: redis://localhost:6379"
echo ""
echo -e "${YELLOW}💡 How to access in Codespaces Simple Browser:${NC}"
echo "   1. Look at the bottom panel in Codespaces for the 'PORTS' tab"
echo "   2. Find port 5173 in the list and click the 'globe' icon to open the frontend"
echo "   3. You can also click the 'globe' icon next to port 8000 to see the backend API docs"
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