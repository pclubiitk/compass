#!/bin/bash
set -e
# The rclone scripts are build keeping this discussion in mind: https://forum.rclone.org/t/backup-use-case/36302

# FIXME(prod): Change the name of the backup option name and path
REMOTE="backup:compass"
LOG="../logs/backup.log"
DB_BACKUP_DIR="../db_backup"

# Ensure the file exits
touch $LOG

echo "[$(date)] Starting backup process
[$(date)] Starting assets syncing" >> "$LOG"

# exclude .go or any other type of file, include directories, i.e. pfp, public, tmp.
rclone sync ../assets "$REMOTE/live/assets" \
        --backup-dir="$REMOTE/incremental/assets/$(date -u +%Y-%m-%dT%H:%M:%S%Z)" \
        --delete-during  \
        --exclude "*.go" \
        --log-file="$LOG" \
        --log-level="INFO"

echo -e "[$(date)] Assets synced to drive
[$(date)] Starting postgres database dump" >> "$LOG"

# FIXME(prod): setting the user(this_is_mjk) according to the docker-compose up.
docker exec db_postgres pg_dump -U this_is_mjk compass | gzip > "$DB_BACKUP_DIR/db_dump.sql.gz"

echo "[$(date)] Completed postgres database dump
[$(date)] Starting db dump syncing" >> "$LOG"

rclone sync ../db_backup "$REMOTE/live/dumps" \
        --backup-dir "$REMOTE/incremental/dumps/$(date -u +%Y-%m-%dT%H:%M:%S%Z)" \
        --delete-during \
        --log-file="$LOG" \
        --log-level="INFO"

echo -e "[$(date)] db dump synced to drive
[$(date)] Mirror sync done
[$(date)] Starting backup cleaning" >> "$LOG"

rclone delete "$REMOTE/incremental" \
        --min-age 15d \
        --log-file="$LOG" \
        --log-level="INFO" \
        --ignore-errors

echo "[$(date)] Completed backup cleanup " >> "$LOG"
