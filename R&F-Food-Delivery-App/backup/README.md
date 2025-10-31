# Backup Management System

This directory contains automated backup solutions for your R&F Food Delivery App database and uploaded files.

## Overview

The backup system provides:

- **Daily SQL dumps** of the PostgreSQL database for the last 7 days
- **Weekly SQL dumps** of the database for up to 60 days
- **Daily image backups** (uploads) for the last 7 days
- **Weekly image backups** for up to 60 days
- **Automatic cleanup** of old backups based on retention policy

### Backup Structure

```
backup/
├── daily/           # Daily backups (kept for 7 days)
│   ├── db_backup_*.sql
│   └── uploads_backup_*.tar.gz
├── weekly/          # Weekly backups (kept for 60 days)
│   ├── db_backup_*.sql
│   └── uploads_backup_*.tar.gz
├── backup-manager.sh    # Main backup script
├── setup-cron.sh        # Cron job setup utility
└── README.md            # This file
```

## Quick Start

### 1. Make scripts executable

```bash
chmod +x backup-manager.sh setup-cron.sh
```

### 2. Manual Backup (Test)

To perform a manual backup:

```bash
./backup-manager.sh backup
```

### 3. Set up automated daily backups

To schedule automatic backups to run daily at 2:00 AM:

```bash
./setup-cron.sh install
```

### 4. View current backups

```bash
./backup-manager.sh list
```

## Usage

### backup-manager.sh

The main backup script with the following commands:

#### Perform backup and cleanup
```bash
./backup-manager.sh backup
```
- Creates daily backups on regular days (Mon-Sun)
- Creates weekly backups on Mondays only
- Automatically cleans up old backups after completion
- Backs up both database (SQL) and uploaded files (tar.gz)

#### Run cleanup only
```bash
./backup-manager.sh cleanup
```
- Deletes daily backups older than 7 days
- Deletes weekly backups older than 60 days

#### List all backups
```bash
./backup-manager.sh list
```
- Shows all existing daily and weekly backups
- Displays file sizes and timestamps
- Shows total storage usage

### setup-cron.sh

Utility script for managing automated backups:

#### Install cron job
```bash
./setup-cron.sh install
```
- Schedules daily backup at 2:00 AM
- Logs output to `backup.log`

#### Remove cron job
```bash
./setup-cron.sh remove
```
- Removes the automated backup schedule

#### Show cron jobs
```bash
./setup-cron.sh show
```
- Displays current cron entries

## Retention Policy

### Daily Backups
- **Kept for**: 7 days
- **Location**: `backup/daily/`
- **Schedule**: Every day

### Weekly Backups
- **Kept for**: 60 days
- **Location**: `backup/weekly/`
- **Schedule**: Every Monday

### Automatic Cleanup
- Runs automatically after each backup
- Removes files based on their modification time (mtime)
- Safe: Only deletes files older than retention periods

## What Gets Backed Up

### 1. Database (SQL)
- PostgreSQL database: `fds`
- Format: SQL dump
- Filename: `db_backup_YYYYMMDD_HHMMSS.sql`
- Size: Typically 10-50 MB (depends on data volume)

### 2. Uploads (TAR.GZ)
- All uploaded images and files
- From: `/app/public/uploads`
- Format: Compressed tar archive
- Filename: `uploads_backup_YYYYMMDD_HHMMSS.tar.gz`
- Size: Depends on number and size of uploaded files

## Monitoring and Logs

### View backup logs
```bash
tail -f backup.log
```

### Check backup status
```bash
./backup-manager.sh list
```

### Disk usage
```bash
du -sh backup/daily backup/weekly
```

## Requirements

- Docker must be running with the following containers:
  - `postgres_db` - PostgreSQL database container
  - `backend_container` - Backend container with uploads
- Sufficient disk space for backups (at least 500MB recommended)
- Cron daemon running (for automated backups)

## Recovery

### Restore database from backup

```bash
# Find the backup file you want to restore
docker exec -i postgres_db psql -U admin fds < backup/daily/db_backup_YYYYMMDD_HHMMSS.sql
```

### Restore uploads from backup

```bash
# Extract the backup
tar -xzf backup/daily/uploads_backup_YYYYMMDD_HHMMSS.tar.gz

# Copy files back to container
docker cp uploads_temp/. backend_container:/app/public/uploads
```

## Troubleshooting

### "Docker container not found"
- Ensure Docker is running
- Check container names match your setup:
  - `postgres_db` for database
  - `backend_container` for backend

### "Permission denied"
- Make scripts executable: `chmod +x *.sh`
- Check file ownership and permissions

### Backup file is empty or corrupt
- Verify database container is running and healthy
- Check available disk space
- Review backup logs for error messages

### Cron job not running
- Verify cron daemon is running: `sudo service cron status`
- Check cron logs: `grep CRON /var/log/syslog`
- Verify script path is correct: `which backup-manager.sh`

## Advanced Configuration

### Change backup time
Edit `setup-cron.sh` and modify:
```bash
CRON_HOUR=2     # Change 2 to desired hour (0-23)
CRON_MINUTE=0   # Change 0 to desired minute (0-59)
```

### Change retention periods
Edit `backup-manager.sh` and modify:
```bash
DAILY_RETENTION_DAYS=7    # Days to keep daily backups
WEEKLY_RETENTION_DAYS=60  # Days to keep weekly backups
```

### Change container names
If your Docker containers have different names, edit `backup-manager.sh`:
```bash
DB_CONTAINER="your_db_container_name"
BACKEND_CONTAINER="your_backend_container_name"
```

## Security Notes

- Backups contain sensitive database data
- Store backups securely and restrict access
- Consider copying backups to external storage
- Implement a disaster recovery plan
- Regularly test backup restoration

## Maintenance

### Weekly tasks
- Monitor backup logs for errors
- Check disk usage doesn't exceed available space
- Verify backup files are being created

### Monthly tasks
- Test restoring a backup to verify integrity
- Review and update retention policy if needed
- Document any custom configurations

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review backup logs: `tail backup.log`
3. Run manual backup for testing: `./backup-manager.sh backup`
4. Check Docker container status: `docker ps`

---

**Last Updated**: 2025-10-31
**Version**: 1.0
