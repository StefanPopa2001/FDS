#!/bin/bash

################################################################################
# Database and Uploads Backup Manager
# 
# Backup Strategy:
# - Daily SQL dumps for the last 7 days
# - Weekly backups for anything older than 7 days
# - Automatic cleanup of old backups based on retention policy
#
# Usage: ./backup-manager.sh [backup|cleanup|list]
################################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR"
DB_CONTAINER="postgres_db"
BACKEND_CONTAINER="backend_container"
DB_NAME="fds"
DB_USER="admin"
UPLOADS_SOURCE_PATH="/app/public/uploads"
UPLOADS_BACKUP_NAME="uploads"

# Retention policy (in days)
DAILY_RETENTION_DAYS=7
WEEKLY_RETENTION_DAYS=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} $timestamp - $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $timestamp - $message"
            ;;
    esac
}

# Function to create directory structure
create_backup_dirs() {
    mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"
    log INFO "Backup directories ready"
}

# Function to get backup date
get_backup_date() {
    date '+%Y%m%d'
}

# Function to get current day of week (0=Monday, 6=Sunday)
get_day_of_week() {
    date '+%u'
}

# Function to check if today is a weekly backup day (Monday)
is_weekly_backup_day() {
    [ "$(get_day_of_week)" -eq 1 ]
}

# Function to backup database
backup_database() {
    local backup_dir=$1
    local backup_date=$(get_backup_date)
    local backup_filename="db_backup_${backup_date}_$(date '+%H%M%S').sql"
    local backup_path="$backup_dir/$backup_filename"
    
    log INFO "Starting database backup to $backup_filename"
    
    if docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$backup_path" 2>/dev/null; then
        local file_size=$(du -h "$backup_path" | cut -f1)
        log SUCCESS "Database backed up successfully ($file_size) -> $backup_filename"
        return 0
    else
        log ERROR "Failed to backup database"
        return 1
    fi
}

# Function to backup uploads
backup_uploads() {
    local backup_dir=$1
    local backup_date=$(get_backup_date)
    local backup_filename="${UPLOADS_BACKUP_NAME}_backup_${backup_date}_$(date '+%H%M%S').tar.gz"
    local backup_path="$backup_dir/$backup_filename"
    
    log INFO "Starting uploads backup to $backup_filename"
    
    # Copy uploads from container and compress
    if docker cp $BACKEND_CONTAINER:$UPLOADS_SOURCE_PATH /tmp/uploads_temp 2>/dev/null; then
        if tar -czf "$backup_path" -C /tmp uploads_temp 2>/dev/null; then
            rm -rf /tmp/uploads_temp
            local file_size=$(du -h "$backup_path" | cut -f1)
            log SUCCESS "Uploads backed up successfully ($file_size) -> $backup_filename"
            return 0
        else
            log ERROR "Failed to compress uploads"
            rm -rf /tmp/uploads_temp
            return 1
        fi
    else
        log ERROR "Failed to copy uploads from container"
        return 1
    fi
}

# Function to perform full backup (database + uploads)
perform_backup() {
    local backup_date=$(get_backup_date)
    
    log INFO "========================================"
    log INFO "Starting backup process for $backup_date"
    log INFO "========================================"
    
    create_backup_dirs
    
    # Determine if it's a weekly backup day
    if is_weekly_backup_day; then
        log INFO "Today is Monday - performing WEEKLY backup"
        backup_database "$BACKUP_DIR/weekly"
        backup_uploads "$BACKUP_DIR/weekly"
    else
        log INFO "Performing DAILY backup"
        backup_database "$BACKUP_DIR/daily"
        backup_uploads "$BACKUP_DIR/daily"
    fi
    
    log INFO "========================================"
    log SUCCESS "Backup completed"
    log INFO "========================================"
}

# Function to cleanup old backups based on retention policy
cleanup_old_backups() {
    log INFO "========================================"
    log INFO "Starting cleanup process"
    log INFO "========================================"
    
    # Cleanup daily backups older than DAILY_RETENTION_DAYS
    log INFO "Cleaning daily backups older than $DAILY_RETENTION_DAYS days..."
    find "$BACKUP_DIR/daily" -type f -mtime +$DAILY_RETENTION_DAYS -delete
    log SUCCESS "Daily backup cleanup completed"
    
    # Cleanup weekly backups older than WEEKLY_RETENTION_DAYS
    log INFO "Cleaning weekly backups older than $WEEKLY_RETENTION_DAYS days..."
    find "$BACKUP_DIR/weekly" -type f -mtime +$WEEKLY_RETENTION_DAYS -delete
    log SUCCESS "Weekly backup cleanup completed"
    
    log INFO "========================================"
    log SUCCESS "Cleanup completed"
    log INFO "========================================"
}

# Function to list all backups
list_backups() {
    log INFO "========================================"
    log INFO "Current Backups"
    log INFO "========================================"
    
    echo ""
    log INFO "DAILY BACKUPS:"
    if [ -d "$BACKUP_DIR/daily" ] && [ "$(ls -A "$BACKUP_DIR/daily")" ]; then
        ls -lh "$BACKUP_DIR/daily" | tail -n +2 | awk '{printf "  %-50s %8s  %s %s %s\n", $9, $5, $6, $7, $8}'
    else
        log WARNING "No daily backups found"
    fi
    
    echo ""
    log INFO "WEEKLY BACKUPS:"
    if [ -d "$BACKUP_DIR/weekly" ] && [ "$(ls -A "$BACKUP_DIR/weekly")" ]; then
        ls -lh "$BACKUP_DIR/weekly" | tail -n +2 | awk '{printf "  %-50s %8s  %s %s %s\n", $9, $5, $6, $7, $8}'
    else
        log WARNING "No weekly backups found"
    fi
    
    echo ""
    log INFO "BACKUP STORAGE USAGE:"
    du -sh "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" 2>/dev/null || true
    
    echo ""
    log INFO "========================================"
}

# Function to get total backup size
get_backup_size() {
    local total_size=0
    
    if [ -d "$BACKUP_DIR/daily" ]; then
        total_size=$(du -sb "$BACKUP_DIR/daily" | cut -f1)
    fi
    
    if [ -d "$BACKUP_DIR/weekly" ]; then
        local weekly_size=$(du -sb "$BACKUP_DIR/weekly" | cut -f1)
        total_size=$((total_size + weekly_size))
    fi
    
    echo $total_size
}

# Main function
main() {
    local action="${1:-backup}"
    
    case $action in
        backup)
            perform_backup
            cleanup_old_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        list)
            list_backups
            ;;
        *)
            echo "Usage: $0 {backup|cleanup|list}"
            echo ""
            echo "Commands:"
            echo "  backup   - Perform backup and cleanup (default)"
            echo "  cleanup  - Run cleanup of old backups only"
            echo "  list     - List all existing backups"
            exit 1
            ;;
    esac
}

# Verify Docker containers are running
verify_containers() {
    local db_running=$(docker ps -q -f name=$DB_CONTAINER)
    local backend_running=$(docker ps -q -f name=$BACKEND_CONTAINER)
    
    if [ -z "$db_running" ]; then
        log ERROR "Database container ($DB_CONTAINER) is not running"
        return 1
    fi
    
    if [ -z "$backend_running" ]; then
        log ERROR "Backend container ($BACKEND_CONTAINER) is not running"
        return 1
    fi
    
    return 0
}

# Entry point
if verify_containers; then
    main "$@"
else
    log ERROR "Failed to verify containers. Cannot proceed with backup."
    exit 1
fi
