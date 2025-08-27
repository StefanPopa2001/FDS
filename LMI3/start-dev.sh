#!/bin/bash

# Start script for local development environment
# This script starts both the frontend and backend servers

# Exit on error
set -e

echo "Setting up environment for local development..."

# Update the main .env file for reference
cat > .env << EOF
# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyDu-sJV3QBGJYzWXBZkpBFBRrv4wGKoSfA

# API URL for the backend service
REACT_APP_API_URL=http://localhost:3001

# Frontend API URL
REACT_APP_API_URL_FRONTEND=http://localhost:3000

# Local Database URL
DATABASE_URL="postgresql://admin:admin@localhost:5432/fds"

# JWT Secret Key
SECRET_KEY="ubuntumybeloved"

# Environment
NODE_ENV=development
EOF

# Copy the .env file to the backend and frontend directories
echo "Copying .env files to appropriate directories..."
cp .env backend-lmi3/.env
cp .env lmi3/.env

# Check if there's a PostgreSQL database running
echo "Checking if PostgreSQL is running..."
if ! pg_isready -h localhost -p 5432 -U admin > /dev/null 2>&1; then
  echo "Warning: PostgreSQL might not be running or credentials might be incorrect."
  echo "Make sure PostgreSQL is running and accessible with the credentials in your .env file."
  echo "You might need to run: docker-compose up db"
fi

# Start the backend and frontend processes in the background
echo "Starting the backend server..."
cd backend-lmi3
# Create backend-specific .env with sudo to avoid permission issues
sudo bash -c "cat > .env << EOF
# Database configuration
DATABASE_URL=\"postgresql://admin:admin@localhost:5432/fds\"

# JWT Secret Key
SECRET_KEY=\"ubuntumybeloved\"

# Environment
NODE_ENV=development
EOF"
sudo npx nodemon index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Starting the frontend server..."
cd lmi3
# Create frontend-specific .env
cat > .env << EOF
# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyDu-sJV3QBGJYzWXBZkpBFBRrv4wGKoSfA

# API URL for the backend service (full URL is needed)
REACT_APP_API_URL=http://localhost:3001

# Frontend URL
REACT_APP_API_URL_FRONTEND=http://localhost:3000
EOF
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Development environment started!"
echo "Backend running at: http://localhost:3001"
echo "Frontend running at: http://localhost:3000"
echo ""
echo "Backend logs: tail -f backend.log"
echo "Frontend logs: tail -f frontend.log"
echo ""
echo "To stop the servers, press Ctrl+C"

# Function to kill processes when the script exits
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
}

# Register the cleanup function to be called on exit
trap cleanup EXIT

# Wait for user to press Ctrl+C
echo "Press Ctrl+C to stop all servers"
wait
