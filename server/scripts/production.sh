#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status
PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/pmk/env/global/bin
# Get the directory where the script is located relative to the start
SCRIPT_DIR=$(dirname "$0")

# Change context to the script's directory
cd "$SCRIPT_DIR" || exit

# All the scripts initiated will receive this directory as reference

# 1. Database and Assets backup
./db_backup.sh

echo "Backed up successfully"
