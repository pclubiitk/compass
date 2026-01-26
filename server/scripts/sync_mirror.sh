#!/bin/bash
set -e

REMOTE="gdrive_encrypt:compass/mirror"
LOG="/srv1/compass/logs/sync.log"

echo "[$(date)] Starting mirror sync" >> "$LOG"

rclone sync /srv/compass/data/public  "$REMOTE/public"  --delete-during
rclone sync /srv/compass/data/tmp     "$REMOTE/tmp"     --delete-during
rclone sync /srv/compass/postgres-backups "$REMOTE/postgres-backups" --delete-during

echo "[$(date)] Mirror sync done" >> "$LOG"
