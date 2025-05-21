#!/bin/bash
# Setup script for QC Standards Application
# This script helps set up the development environment

set -e  # Exit on any error

# Print colored messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   QC Standards Application Setup       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Docker is installed
echo -e "${YELLOW}Checking for Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}Docker is installed.${NC}"

# Check if Docker Compose is installed
echo -e "${YELLOW}Checking for Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}Docker Compose is installed.${NC}"

# Create .env file if it doesn't exist
echo -e "${YELLOW}Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created.${NC}"
else
    echo -e "${YELLOW}.env file already exists. Skipping...${NC}"
fi

# Start development environment
echo -e "${YELLOW}Starting development environment...${NC}"
docker compose -f docker-compose.dev.yml up -d

# Check if containers are running
echo -e "${YELLOW}Checking if containers are running...${NC}"
if [ "$(docker ps -q -f name=qc-standards-db)" ] && [ "$(docker ps -q -f name=qc-standards-redis)" ]; then
    echo -e "${GREEN}Development environment is running.${NC}"
else
    echo -e "${RED}Some containers failed to start. Please check the logs:${NC}"
    echo "docker compose -f docker-compose.dev.yml logs"
    exit 1
fi

# Print success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup Completed Successfully!        ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Available services:"
echo -e "- Database: postgresql://postgres:password@localhost:5432/qc_standards"
echo -e "- Redis: redis://localhost:6379"
echo ""
echo -e "Next steps:"
echo -e "1. ${YELLOW}cd backend${NC} and run ${YELLOW}pip install -r requirements.txt${NC}"
echo -e "2. Start the backend: ${YELLOW}cd backend && uvicorn app.main:app --reload${NC}"
echo -e "3. In another terminal: ${YELLOW}cd frontend && npm install${NC}"
echo -e "4. Start the frontend: ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo -e "API documentation: http://localhost:8000/api/docs"
echo -e "Frontend: http://localhost:5173"
echo ""
echo -e "To stop the environment: ${YELLOW}docker compose -f docker-compose.dev.yml down${NC}"
echo ""
