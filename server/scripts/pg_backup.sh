#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
BACKUP_DIR="/srv/compass/postgres-backups"
LOG="/srv/compass/logs/pg_backup.log"

echo "[$(date)] Starting Postgres backup" >> "$LOG"

docker exec postgres \
  pg_dumpall -U postgres \
  | gzip > "$BACKUP_DIR/pg_dump_$TIMESTAMP.sql.gz"

echo "[$(date)] Postgres backup complete" >> "$LOG"
