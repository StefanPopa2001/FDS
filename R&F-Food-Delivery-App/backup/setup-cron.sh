#!/bin/bash

################################################################################
# Cron Job Setup Script
# 
# This script sets up the cron job for automatic daily backups.
# It adds a cron entry to run the backup manager daily at a specified time.
#
# Usage: ./setup-cron.sh [install|remove|show]
################################################################################

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-manager.sh"
CRON_HOUR=2  # Run at 2 AM
CRON_MINUTE=0
LOG_FILE="$SCRIPT_DIR/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local level=$1
    shift
    local message="$@"
    
    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Make backup script executable
make_executable() {
    if [ ! -x "$BACKUP_SCRIPT" ]; then
        chmod +x "$BACKUP_SCRIPT"
        log INFO "Made backup script executable"
    fi
}

# Install cron job
install_cron() {
    make_executable
    
    log INFO "Installing cron job for daily backups..."
    log INFO "Schedule: Daily at ${CRON_HOUR}:${CRON_MINUTE}"
    
    # Create cron entry
    local cron_entry="$CRON_MINUTE $CRON_HOUR * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        log WARNING "Cron job already exists"
        return 1
    fi
    
    # Add cron job
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
    
    if [ $? -eq 0 ]; then
        log SUCCESS "Cron job installed successfully"
        log INFO "Backup will run daily at ${CRON_HOUR}:${CRON_MINUTE}"
        log INFO "Logs will be saved to: $LOG_FILE"
        return 0
    else
        log ERROR "Failed to install cron job"
        return 1
    fi
}

# Remove cron job
remove_cron() {
    log INFO "Removing cron job..."
    
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
        
        if [ $? -eq 0 ]; then
            log SUCCESS "Cron job removed successfully"
            return 0
        else
            log ERROR "Failed to remove cron job"
            return 1
        fi
    else
        log WARNING "No cron job found for this script"
        return 1
    fi
}

# Show current cron jobs
show_cron() {
    log INFO "Current cron jobs:"
    echo ""
    crontab -l 2>/dev/null | grep -E "(backup|#)" || echo "No cron jobs found"
    echo ""
}

# Main function
main() {
    local action="${1:-show}"
    
    case $action in
        install)
            install_cron
            ;;
        remove)
            remove_cron
            ;;
        show)
            show_cron
            ;;
        *)
            echo "Usage: $0 {install|remove|show}"
            echo ""
            echo "Commands:"
            echo "  install - Install daily backup cron job"
            echo "  remove  - Remove the backup cron job"
            echo "  show    - Show current cron jobs"
            exit 1
            ;;
    esac
}

main "$@"
