#!/bin/bash
set -e

REMOTE="gdrive_encrypt:compass/snapshots"
LOG="/srv/compass/logs/cleanup.log"

echo "[$(date)] Cleaning old backups" >> "$LOG"

rclone delete "$REMOTE" --min-age 14d --rmdirs

echo "[$(date)] Cleanup complete" >> "$LOG"
