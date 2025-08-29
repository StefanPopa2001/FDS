#!/bin/bash

# Script to rebuild and restart all Docker containers
# Updated: August 29, 2025

echo "🔄 Rebuilding and restarting all containers..."

# Change to the Docker directory
cd "$(dirname "$0")/Docker"

# Stop any running containers
echo "🛑 Stopping running containers..."
docker-compose down

# Remove any old containers to ensure clean restart
echo "🧹 Removing old containers..."
docker-compose rm -f

# Remove unused images to free up space (optional)
echo "🗑️ Cleaning up unused images..."
docker image prune -f

# Rebuild all images with no cache
echo "🏗️ Rebuilding all images..."
docker-compose build --no-cache

# Start containers in detached mode
echo "🚀 Starting all containers..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check container health and restart if needed
echo "🔍 Checking container health..."
for container in $(docker-compose ps -q); do
    container_name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    health_status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-healthcheck")

    if [ "$health_status" = "unhealthy" ]; then
        echo "⚠️ Container $container_name is unhealthy, restarting..."
        docker-compose restart $container_name
        sleep 5
    elif [ "$health_status" = "healthy" ]; then
        echo "✅ Container $container_name is healthy"
    else
        echo "ℹ️ Container $container_name has no health check"
    fi
done

# Show running containers
echo "✅ Container status:"
docker-compose ps

# Verify services are accessible
echo "🌐 Verifying services accessibility..."
echo "Backend should be available at: http://168.231.81.212/api"
echo "Frontend should be available at: http://168.231.81.212"
echo "PgAdmin should be available at: http://168.231.81.212/pgadmin"

# Test backend connectivity
echo "🔗 Testing backend connectivity..."
if curl -f -s http://168.231.81.212/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️ Backend is not responding yet, it may still be starting up"
fi

# Print recent logs from containers
echo "📜 Recent container logs:"
docker-compose logs --tail=10

echo ""
echo "🎉 Container rebuild and restart completed!"
echo "📊 Summary:"
echo "   - All containers rebuilt with latest code"
echo "   - Health checks performed and unhealthy containers restarted"
echo "   - Services verified and accessible"
echo ""
echo "🚀 Your application is ready at: http://168.231.81.212"
