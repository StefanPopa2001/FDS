#!/bin/bash

# Script to rebuild and restart all Docker containers
# Created: August 14, 2025

echo "🔄 Rebuilding and restarting all containers..."

# Change to the Docker directory
cd "$(dirname "$0")/Docker"

# Stop any running containers
echo "🛑 Stopping running containers..."
docker-compose down

# Remove any old images to ensure clean build
echo "🧹 Removing old images..."
docker-compose rm -f

# Rebuild all images
echo "🏗️ Rebuilding all images..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting all containers..."
docker-compose up -d

# Show running containers
echo "✅ Container status:"
docker-compose ps

echo "🌐 Checking if services are accessible..."
echo "Backend should be available at: http://168.231.81.212/api"
echo "Frontend should be available at: http://168.231.81.212"
echo "PgAdmin should be available at: http://168.231.81.212/pgadmin"

# Print logs from containers to verify they're working correctly
echo "📜 Recent container logs:"
docker-compose logs --tail=20
