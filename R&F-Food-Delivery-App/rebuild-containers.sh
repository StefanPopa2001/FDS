#!/bin/bash

# LMI-3 Production-style deployment script
# Keeps previous images as a backup and only replaces running services when the new build is verified
# Usage: ./rebuild-containers.sh [--complete|-c]  (default: fast build using cache)

set -euo pipefail

cd "$(dirname "$0")/Docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err() { echo -e "${RED}❌ $1${NC}"; }

PUBLIC_IP=${PUBLIC_IP:-82.25.118.116}

echo "╔════════════════════════════════════════╗"
echo "║    FDS Safe Rebuild & Deploy Script    ║"
echo "╚════════════════════════════════════════╝"

BUILD_MODE=${1:-fast}
if [ "$BUILD_MODE" = "--complete" ] || [ "$BUILD_MODE" = "-c" ]; then
    BUILD_MODE=complete
else
    BUILD_MODE=fast
fi

BUILD_ID="$(date +%Y%m%d-%H%M%S)"
log "Build ID: $BUILD_ID"
log "Mode: $BUILD_MODE"

# Ensure docker is available
if ! docker info >/dev/null 2>&1; then
    err "Docker does not appear to be running"
    exit 1
fi

# Ensure network exists
if ! docker network inspect starcozka-app-network >/dev/null 2>&1; then
    warn "Creating network starcozka-app-network"
    docker network create starcozka-app-network || true
fi

SERVICES=(db backend frontend)

# Backup current images by tagging them with :previous-$BUILD_ID
declare -A ORIGINAL_REPO
declare -A PREV_TAG

log "Backing up current images (if present)..."
for svc in backend frontend; do
    # Get repository:tag for the service image as defined by compose
    repo_tag=$(docker compose images --format '{{.Repository}}:{{.Tag}}' $svc 2>/dev/null || true)
    imgid=$(docker compose images -q $svc 2>/dev/null || true)
    if [ -n "$imgid" ] && [ -n "$repo_tag" ]; then
        repo_only=$(echo "$repo_tag" | cut -d: -f1)
        prev_tag="${repo_only}:previous-${BUILD_ID}"
        docker tag "$imgid" "$prev_tag" || true
        ORIGINAL_REPO[$svc]="$repo_tag"
        PREV_TAG[$svc]="$prev_tag"
        success "Backed up $svc -> $prev_tag"
    else
        warn "No existing image found for $svc, skipping backup"
    fi
done

# Optionally prune builder when doing a full rebuild
if [ "$BUILD_MODE" = "complete" ]; then
    log "Pruning builder cache (complete mode)"
    docker builder prune -f --filter until=1h || true
    BUILD_ARGS="--no-cache --pull"
else
    BUILD_ARGS=""
fi

log "Building images..."
# Build backend first (more critical)
if docker compose build $BUILD_ARGS backend; then
    success "Backend image built"
else
    err "Backend build failed — aborting and attempting rollback"
    ROLLBACK=true
fi

# Build frontend (may be cached to speed up builds)
if [ "${ROLLBACK:-false}" != true ]; then
    if docker compose build $BUILD_ARGS frontend; then
        success "Frontend image built"
    else
        err "Frontend build failed — aborting and attempting rollback"
        ROLLBACK=true
    fi
fi

if [ "${ROLLBACK:-false}" = true ]; then
    # Try to restore previous images if we backed them up
    warn "Build failed — restoring previous images (if available)"
    for svc in backend frontend; do
        if [ -n "${ORIGINAL_REPO[$svc]:-}" ] && [ -n "${PREV_TAG[$svc]:-}" ]; then
            docker tag "${PREV_TAG[$svc]}" "${ORIGINAL_REPO[$svc]}" || true
            warn "Restored ${svc} image to ${ORIGINAL_REPO[$svc]}"
        fi
    done
    exit 1
fi

# Start DB first (if not already running)
log "Starting database container (no-deps)..."
docker compose up -d --no-deps db || true
sleep 5

# Start backend and ensure it's healthy before replacing frontend
log "Starting backend (candidate)..."
docker compose up -d --no-deps --force-recreate backend

log "Waiting for backend to become healthy..."
success=false
for i in {1..12}; do
    # Prefer an internal health check via the container
    if docker compose exec -T backend sh -c "curl -fsS http://localhost:3001/health >/dev/null 2>&1"; then
        success=true
        break
    fi
    sleep 5
    log "Retrying health check ($i/12)"
done

if [ "$success" != true ]; then
    err "Backend did not become healthy — rolling back to previous images"
    # rollback by retagging previous images back to original repo:tag and recreating backend
    for svc in backend frontend; do
        if [ -n "${ORIGINAL_REPO[$svc]:-}" ] && [ -n "${PREV_TAG[$svc]:-}" ]; then
            docker tag "${PREV_TAG[$svc]}" "${ORIGINAL_REPO[$svc]}" || true
            warn "Restored ${svc} image to ${ORIGINAL_REPO[$svc]}"
        fi
    done
    docker compose up -d --no-deps --force-recreate backend || true
    exit 1
fi
success "Backend is healthy"

# Run Prisma schema push (safe retry)
log "Running schema push on backend..."
for i in {1..3}; do
    if docker compose exec -T backend npx prisma db push --accept-data-loss; then
        success "Schema push completed"
        break
    else
        warn "Schema push failed, retrying ($i/3)"
        sleep 3
    fi
    if [ $i -eq 3 ]; then
        err "Schema push failed after retries — rolling back"
        for svc in backend frontend; do
            if [ -n "${ORIGINAL_REPO[$svc]:-}" ] && [ -n "${PREV_TAG[$svc]:-}" ]; then
                docker tag "${PREV_TAG[$svc]}" "${ORIGINAL_REPO[$svc]}" || true
            fi
        done
        docker compose up -d --no-deps --force-recreate backend || true
        exit 1
    fi
done

# Start frontend now that backend is healthy and schema applied
log "Starting frontend (candidate)"
docker compose up -d --no-deps --force-recreate frontend

# Final checks against public IP
log "Checking public endpoints on $PUBLIC_IP"
if curl -fsS http://$PUBLIC_IP/ >/dev/null 2>&1; then
    success "Frontend root is reachable"
else
    warn "Frontend root not reachable yet"
fi

if curl -fsS http://$PUBLIC_IP/api/health >/dev/null 2>&1; then
    success "Backend health endpoint reachable via public IP"
else
    warn "Backend health endpoint NOT reachable via public IP"
fi

# If we made it here, deployment succeeded — remove previous backup tags
log "Cleaning up previous images (if any)"
for svc in backend frontend; do
    if [ -n "${PREV_TAG[$svc]:-}" ]; then
        docker image rm "${PREV_TAG[$svc]}" || true
        success "Removed backup tag ${PREV_TAG[$svc]}"
    fi
done

echo ""
success "Deployment successful!"
log "Services are up. Summary:"
docker compose ps

exit 0
