#!/usr/bin/env bash
set -e


echo "=== Rclone Syncing Started ==="
date


rclone sync ~/temp/being_joker/ gdrive_encrypt:current \
  --backup-dir gdrive_encrypt:images/$(date +%F_%H-%M-%S) \
  --log-file=/home/shivang/rclone-sync.log \
  --log-level INFO

echo "=== Rclone Syncing Completed Successfully ==="
date
