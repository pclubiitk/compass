#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# CONFIGURATION
# -----------------------------

REMOTE="gdrive_encrypt:images"
LOCAL="$HOME/drive-restore"
LOG="$HOME/rclone-restore.log"

# -----------------------------
# PRE-FLIGHT CHECKS
# -----------------------------

echo "=== Rclone Restore Started ==="
date

# Ensure destination exists
mkdir -p "$LOCAL"

# -----------------------------
# RESTORE OPERATION
# -----------------------------

rclone copy "$REMOTE" "$LOCAL" \
  --progress \
  --log-file="$LOG" \
  --log-level INFO \
  --transfers 4 \
  --checkers 8

echo "=== Restore Completed Successfully ==="
date

