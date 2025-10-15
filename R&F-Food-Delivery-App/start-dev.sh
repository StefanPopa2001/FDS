#!/bin/bash

# Simple development startup script
# Just runs npm run dev for both frontend and backend

# Exit on error
set -e

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[DEV]${NC} Starting development environment..."

# Create/update .env files
echo -e "${GREEN}[DEV]${NC} Setting up environment files..."
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_URL_FRONTEND=http://localhost:3000
DATABASE_URL="postgresql://admin:admin@localhost:5432/fds"
SECRET_KEY="ubuntumybeloved"
NODE_ENV=development
EOF

cp .env backend-lmi3/.env
cp .env lmi3/.env

# Create log files
touch backend.log frontend.log

# Start backend with integrated migration and hot reloading
echo -e "${GREEN}[DEV]${NC} Starting backend (with auto-migration)..."
cd backend-lmi3
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend with hot reloading
echo -e "${GREEN}[DEV]${NC} Starting frontend..."
cd lmi3
BROWSER=none npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo
echo -e "${GREEN}[DEV]${NC} 🚀 Development environment ready!"
echo -e "${GREEN}[DEV]${NC}    Backend:  http://localhost:3001 (with auto-migration & hot reload)"
echo -e "${GREEN}[DEV]${NC}    Frontend: http://localhost:3000 (with hot reload)"
echo
echo -e "${YELLOW}[DEV]${NC} 📝 View logs: tail -f backend.log frontend.log"
echo -e "${YELLOW}[DEV]${NC} ⛔ Stop servers: Press Ctrl+C"

# Cleanup function
function cleanup {
    echo
    echo -e "${YELLOW}[DEV]${NC} Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "node dev-start.js" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    echo -e "${GREEN}[DEV]${NC} Development environment stopped"
}

trap cleanup EXIT INT TERM
wait
