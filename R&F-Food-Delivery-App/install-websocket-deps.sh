#!/bin/bash

# Install WebSocket dependencies for LMI3 project
# Run this script after pulling WebSocket updates

echo "🔄 Installing WebSocket dependencies..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend-lmi3
npm install socket.io@^4.7.5
cd ..

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd lmi3
npm install socket.io-client@^4.7.5
cd ..

echo "✅ WebSocket dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your development environment: ./start-dev.sh"
echo "2. Or rebuild containers: ./rebuild-containers.sh"
echo "3. Check admin panel for real-time connection status"
echo "4. Test by creating a new order - you should see instant updates!"
