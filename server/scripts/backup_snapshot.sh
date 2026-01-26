#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
REMOTE="gdrive_encrypt:compass/snapshots/$TIMESTAMP"
LOG="/srv/compass/logs/snapshot.log"

echo "[$(date)] Starting snapshot $TIMESTAMP" >> "$LOG"

rclone copy /srv/compass/data/public  "$REMOTE/public"
rclone copy /srv/compass/data/tmp     "$REMOTE/tmp"
rclone copy /srv/compass/postgres-backups "$REMOTE/postgres-backups"

echo "[$(date)] Snapshot completed" >> "$LOG"
