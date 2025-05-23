#!/bin/bash

# Manual startup script for Codespaces
# This script provides a manual way to start the application components

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Manual Startup for QC Standards App${NC}"
echo "=================================================="

# Check if databases are running
if ! docker ps | grep -q qc-standards-app-db; then
  echo -e "${YELLOW}🐘 Starting database services...${NC}"
  docker-compose -f docker-compose.dev.yml up -d db redis
  echo -e "${GREEN}✅ Database services started${NC}"
else
  echo -e "${GREEN}✅ Database services already running${NC}"
fi

# Create logo.png if it doesn't exist
if [ ! -f "frontend/public/logo.png" ]; then
  echo -e "${YELLOW}⚙️  Creating placeholder logo.png...${NC}"
  mkdir -p frontend/public
  # Create a small file
  echo "placeholder" > frontend/public/logo.png
  echo -e "${GREEN}✅ logo.png placeholder created${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✅ .env file created${NC}"
fi

# Instructions
echo ""
echo -e "${YELLOW}📋 Manual startup instructions:${NC}"
echo "=================================================="
echo "1. Start the backend in a terminal:"
echo -e "${GREEN}   cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo ""
echo "2. Start the frontend in another terminal:"
echo -e "${GREEN}   cd frontend && npm run dev -- --host 0.0.0.0 --port 5173${NC}"
echo ""
echo -e "${YELLOW}🌐 Access the application at:${NC}"
echo "   Frontend: https://curly-engine-jiqgp57q6jvvcp6g4-5173.app.github.dev"
echo "   Backend:  https://curly-engine-jiqgp57q6jvvcp6g4-8000.app.github.dev"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC}"
echo -e "${GREEN}   docker-compose -f docker-compose.dev.yml down${NC}"
echo ""
echo -e "${GREEN}Good luck!${NC}"
