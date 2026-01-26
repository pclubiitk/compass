#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <YYYY-MM-DD_HH-MM>"
  exit 1
fi

SNAPSHOT_DATE="$1"
REMOTE="gdrive_encrypt:compass/snapshots/$SNAPSHOT_DATE"
LOG="/srv/compass/logs/restore.log"

APP_PUBLIC="/srv/compass/data/public"
APP_TMP="/srv/compass/data/tmp"
PG_BACKUPS="/srv/compass/postgres-backups"

echo "===================================" | tee -a "$LOG"
echo "RESTORE SNAPSHOT: $SNAPSHOT_DATE" | tee -a "$LOG"
echo "START TIME: $(date)" | tee -a "$LOG"
echo "===================================" | tee -a "$LOG"

echo
echo "WARNING: THIS WILL OVERWRITE LIVE DATA"
echo "Snapshot: $REMOTE"
echo
read -p "Type RESTORE to continue: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Restore aborted"
  exit 1
fi

# -------------------------
# 1. Restore application data
# -------------------------
echo "[1/3] Restoring app data..." | tee -a "$LOG"

rclone sync "$REMOTE/public" "$APP_PUBLIC"
rclone sync "$REMOTE/tmp" "$APP_TMP"

echo "App data restored" | tee -a "$LOG"

# -------------------------
# 2. Restore Postgres backup files
# -------------------------
echo "[2/3] Restoring Postgres backup files..." | tee -a "$LOG"

rclone sync "$REMOTE/postgres-backups" "$PG_BACKUPS"

echo "Postgres backup files restored" | tee -a "$LOG"

# -------------------------
# 3. Restore database
# -------------------------
echo "[3/3] Restoring Postgres database..." | tee -a "$LOG"

LATEST_DUMP=$(ls -t "$PG_BACKUPS"/pg_dump_*.sql.gz | head -n 1)

if [ -z "$LATEST_DUMP" ]; then
  echo "No pg_dump file found!" | tee -a "$LOG"
  exit 1
fi

echo "Using dump: $LATEST_DUMP" | tee -a "$LOG"

read -p "This will DROP & REPLACE the database. Type YES to continue: " DB_CONFIRM
if [ "$DB_CONFIRM" != "YES" ]; then
  echo "Database restore aborted"
  exit 1
fi

gunzip -c "$LATEST_DUMP" | docker exec -i postgres psql -U postgres

echo "Database restored" | tee -a "$LOG"

echo "===================================" | tee -a "$LOG"
echo "RESTORE COMPLETED: $(date)" | tee -a "$LOG"
echo "===================================" | tee -a "$LOG"
