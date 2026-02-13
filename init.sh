#!/bin/bash

# StarLink SRM Initialization Script
# This script sets up the development environment for StarLink SRM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  StarLink SRM Initialization${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"
echo ""

# Navigate to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"
echo ""

# Create necessary directories
echo -e "${BLUE}Creating project directories...${NC}"
mkdir -p frontend/src/{components/{ui,layout,business},pages/{dashboard,orders,suppliers,sourcing,finance},hooks,services,stores,utils}
mkdir -p frontend/public
mkdir -p backend/src/{controllers,services,models,routes,middlewares,utils,ai}
mkdir -p backend/database/{migrations,seeds}
mkdir -p backend/config
echo -e "${GREEN}Directories created successfully${NC}"
echo ""

# Install frontend dependencies
if [ -d "frontend" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}Frontend directory not found, skipping...${NC}"
fi
echo ""

# Install backend dependencies
if [ -d "backend" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Backend directory not found, skipping...${NC}"
fi
echo ""

# Create environment file if not exists
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}Creating backend .env file...${NC}"
    cat > backend/.env << 'EOF'
# Backend configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=./database/starlink.db

# JWT
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# MiniMax AI (optional - for AI features)
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_BASE_URL=https://api.minimax.chat/v1

# WeChat configuration (optional - for WeChat login)
WECHAT_APP_ID=your-wechat-appid
WECHAT_APP_SECRET=your-wechat-secret
EOF
    echo -e "${GREEN}Backend .env file created${NC}"
fi
echo ""

# Initialize database
if [ -f "backend/database/init.js" ]; then
    echo -e "${BLUE}Initializing database...${NC}"
    cd backend
    node database/init.js
    cd ..
    echo -e "${GREEN}Database initialized${NC}"
fi
echo ""

# Create Docker files if needed
if [ ! -f "Dockerfile" ]; then
    echo -e "${BLUE}Creating Dockerfile...${NC}"
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install --prefix backend && npm install --prefix frontend

# Copy source code
COPY . .

# Build frontend
RUN npm run build --prefix frontend

# Expose ports
EXPOSE 3001 80

# Start nginx and node
CMD ["sh", "-c", "node backend/server.js & nginx -g 'daemon off;'"]
EOF
    echo -e "${GREEN}Dockerfile created${NC}"
fi

if [ ! -f "docker-compose.yml" ]; then
    echo -e "${BLUE}Creating docker-compose.yml...${NC}"
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
      - "80:80"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/app/database/starlink.db
      - JWT_SECRET=${JWT_SECRET}
      - MINIMAX_API_KEY=${MINIMAX_API_KEY}
    volumes:
      - ./database:/app/database
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    restart: unless-stopped
EOF
    echo -e "${GREEN}docker-compose.yml created${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}To start the development servers:${NC}"
echo ""
echo "  # Terminal 1 - Backend (Port 3001)"
echo "  cd backend && npm run dev"
echo ""
echo "  # Terminal 2 - Frontend (Port 5173)"
echo "  cd frontend && npm run dev"
echo ""
echo -e "${YELLOW}Access the application:${NC}"
echo "  PC端: http://localhost:5173"
echo "  移动端: http://localhost:5173/mobile"
echo ""
echo -e "${YELLOW}Test Accounts:${NC}"
echo "  管理员: admin / admin123"
echo "  采购员: purchaser / purchase123"
echo "  供应商: huawei / huawei123"
echo "  财务: finance / finance123"
echo ""
echo -e "${BLUE}Happy coding!${NC}"
