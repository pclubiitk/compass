#!/bin/bash
set -e

REMOTE="backup:compass/live"
LOG="../logs/backup.log"
DB_BACKUP_DIR="../db_backup"
ASSETS_DIR="../assets"

# Get the directory where the script is located relative to the start
SCRIPT_DIR=$(dirname "$0")

# Change context to the script's directory
cd "$SCRIPT_DIR" || exit

# Ensure the file exits
touch $LOG

echo "START TIME: $(date)" | tee -a "$LOG"

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
echo "[1/3] Restoring assets data..." | tee -a "$LOG"

rclone sync "$REMOTE/assets" "$ASSETS_DIR" --exclude "*.go*" --log-file="$LOG" --log-level="INFO" --ignore-errors

echo "Assets data restored" | tee -a "$LOG"

# -------------------------
# 2. Restore Postgres backup files
# -------------------------
echo "[2/3] Restoring Postgres backup dump files..." | tee -a "$LOG"

rclone sync "$REMOTE/dumps" "$DB_BACKUP_DIR" --log-file="$LOG" --log-level="INFO" 

echo "Postgres backup dump files restored" | tee -a "$LOG"

# -------------------------
# 3. Restore database
# -------------------------
echo "[3/3] Restoring Postgres database..." | tee -a "$LOG"

LATEST_DUMP=$(ls -t "$DB_BACKUP_DIR"/db_dump.sql.gz | head -n 1)

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

# FIXME(prod): setting the user(this_is_mjk) according to the docker-compose up.
# Reset schema to avoid duplicate objects on restore
docker exec -i db_postgres psql -U this_is_mjk -d compass -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c "$LATEST_DUMP" | docker exec -i db_postgres psql -U this_is_mjk compass

echo "Database restored" | tee -a "$LOG"

echo "RESTORE COMPLETED: $(date)" | tee -a "$LOG"
