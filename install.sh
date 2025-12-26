#!/bin/bash

# PaperPilot Web - Installation & Setup Script (Robust Version)

# Stop on error is OFF initially so we can catch and explain errors
set +e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

error_exit() {
    echo -e "\n${RED}ERROR: $1${NC}"
    echo "Check the error message above for details."
    exit 1
}

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   PaperPilot Web - Setup Assistant    ${NC}"
echo -e "${BLUE}=======================================${NC}"

# 1. Create Data Directories
echo -e "\n${GREEN}[1/4] Creating data directories...${NC}"
mkdir -p data/input data/output data/temp || error_exit "Failed to create directories."
echo "Directories created at ./data"

# 2. Check for Docker
echo -e "\n${GREEN}[2/4] Checking for Docker...${NC}"
DOCKER_COMPOSE_CMD=""

if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
fi

if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
    echo -e "${BLUE}Docker Compose detected: $DOCKER_COMPOSE_CMD${NC}"
    echo -e "This is the recommended way to run PaperPilot."
    
    read -p "Do you want to build and start the containers now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${GREEN}[3/4] Building and starting services...${NC}"
        $DOCKER_COMPOSE_CMD up -d --build || error_exit "Docker Compose failed."
        
        echo -e "\n${GREEN}[4/4] Setup Complete!${NC}"
        echo -e "------------------------------------------------"
        echo -e "Web Interface: ${BLUE}http://localhost:5173${NC}"
        echo -e "Backend API:   ${BLUE}http://localhost:8000/docs${NC}"
        echo -e "------------------------------------------------"
        exit 0
    fi
else
    echo -e "${RED}Docker not found or skipped.${NC}"
fi

# 3. Local Installation
echo -e "\n${BLUE}Proceeding with Local Installation...${NC}"
read -p "Do you want to attempt a local install? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Exiting."
    exit 0
fi

# System Dependencies (Debian/Ubuntu specific)
if command -v apt-get &> /dev/null; then
    echo -e "\n${GREEN}Installing system libraries (requires sudo)...${NC}"
    sudo apt-get update
    # Ensure python3-venv is installed! Common crash cause.
    sudo apt-get install -y poppler-utils libzbar0 libgl1 python3-venv || error_exit "Failed to install system dependencies via apt."
else
    echo -e "${RED}Warning: 'apt-get' not found.${NC}"
    echo "Please ensure you have: poppler-utils, libzbar, libgl1, and python3-venv installed."
    read -p "Press Enter to continue..."
fi

# Backend Setup
echo -e "\n${GREEN}Setting up Backend...${NC}"
cd backend || error_exit "Backend directory missing."

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv || error_exit "Failed to create virtual environment. Try: sudo apt install python3-venv"
fi

echo "Installing Python dependencies..."
# Use path directly to avoid 'source' issues in some shells
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt || error_exit "Failed to install Python requirements."
cd ..

# Frontend Setup
echo -e "\n${GREEN}Setting up Frontend...${NC}"
if command -v npm &> /dev/null; then
    cd frontend || error_exit "Frontend directory missing."
    echo "Installing Node dependencies..."
    npm install || error_exit "npm install failed."
    cd ..
else
    error_exit "npm not found. Please install Node.js."
fi

echo -e "\n${GREEN}Installation Complete!${NC}"
echo -e "------------------------------------------------"
echo -e "Run './start_dev.sh' to start the app."