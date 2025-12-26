#!/bin/bash

# PaperPilot Web - Local Development Launcher
# Starts both Backend and Frontend in a single terminal.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Cleanup function to kill background processes on exit
cleanup() {
    echo -e "\n${RED}Stopping services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

echo -e "${BLUE}======================================="
    echo -e "${BLUE}   PaperPilot Web - Dev Launcher       "
    echo -e "${BLUE}======================================="

# Check Backend Environment
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}Error: Backend virtual environment not found.${NC}"
    echo "Please run './install.sh' first and choose the Local Installation option."
    exit 1
fi

# Check Node Modules
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}Error: Frontend node_modules not found.${NC}"
    echo "Please run './install.sh' first or 'npm install' in frontend directory."
    exit 1
fi

echo -e "\n${GREEN}[1/2] Starting Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate
# Run uvicorn in background
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

echo -e "\n${GREEN}[2/2] Starting Frontend (Vite)...${NC}"
cd frontend
# Run vite in background
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo -e "\n${BLUE}Services are running!${NC}"
echo -e "Backend:  http://localhost:8000"
echo -e "Frontend: http://localhost:5173"
echo -e "\n${RED}Press Ctrl+C to stop everything.${NC}"

# Wait for processes
wait
