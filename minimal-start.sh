#!/bin/bash

# Ultra-light startup script for resource-constrained environments
# Optimized for Codespaces with minimal resource usage

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting QC Standards App (Minimal Mode)${NC}"
echo "============================================"

# 1. Kill any existing processes to free memory
echo -e "${YELLOW}Cleaning up old processes...${NC}"
pkill -f "uvicorn" || true
pkill -f "npm run dev" || true
pkill -f "node" || true
sleep 2

# 2. Stop all Docker containers
echo -e "${YELLOW}Stopping Docker containers...${NC}"
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
docker-compose -f docker-compose.minimal.yml down 2>/dev/null || true
docker system prune -f >/dev/null 2>&1 || true

# 3. Check available memory
echo -e "${GREEN}System resources:${NC}"
free -h | grep -E "Mem:|Swap:" || true
echo ""

# 4. Create .env if needed
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/qc_standards" > .env
fi

# 5. Start minimal database only
echo -e "${YELLOW}Starting minimal PostgreSQL...${NC}"
docker-compose -f docker-compose.minimal.yml up -d db

# Wait for database
echo -e "${YELLOW}Waiting for database (30s)...${NC}"
sleep 30

# 6. Run minimal backend
echo -e "${YELLOW}Starting backend in minimal mode...${NC}"
cd backend

# Install only essential packages
if [ ! -f ".minimal_deps" ]; then
    echo -e "${YELLOW}Installing minimal Python dependencies...${NC}"
    pip install --no-cache-dir fastapi uvicorn psycopg2-binary sqlmodel python-jose passlib python-multipart
    touch .minimal_deps
fi

# Start backend with minimal workers
echo -e "${GREEN}Starting API server...${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --limit-concurrency 10 --timeout-keep-alive 5 &

cd ..

echo ""
echo -e "${GREEN}✅ Minimal setup completed!${NC}"
echo "============================="
echo -e "${GREEN}API is available at:${NC} http://localhost:8000"
echo -e "${GREEN}API Docs:${NC} http://localhost:8000/api/docs"
echo ""
echo -e "${YELLOW}Note: Frontend is disabled in minimal mode to save resources${NC}"
echo -e "${YELLOW}Use the API directly or enable frontend manually if needed${NC}"
echo ""
echo -e "${GREEN}To stop:${NC} docker-compose -f docker-compose.minimal.yml down"
