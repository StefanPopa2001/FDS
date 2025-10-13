#!/bin/bash

# Script to restart all Docker containers
# Created: August 29, 2025

echo "🔄 Restarting all containers..."

# Change to the Docker directory
cd "$(dirname "$0")/Docker"

# Restart all containers
echo "🚀 Restarting containers..."
docker-compose restart

# Wait a moment for containers to restart
sleep 5

# Check container health
echo "🔍 Checking container health..."
for container in $(docker-compose ps -q); do
    container_name=$(docker inspect --format='{{.Name}}' $container | sed 's/\///')
    health_status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-healthcheck")

    if [ "$health_status" = "healthy" ]; then
        echo "✅ $container_name is healthy"
    elif [ "$health_status" = "unhealthy" ]; then
        echo "⚠️ $container_name is unhealthy"
    else
        echo "ℹ️ $container_name has no health check"
    fi
done

# Show final status
echo "✅ Container status:"
docker-compose ps

echo ""
echo "🎉 Container restart completed!"
echo "🚀 Your application is ready at: http://168.231.81.212"
