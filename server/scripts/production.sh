#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

# Get the directory where the script is located relative to the start
SCRIPT_DIR=$(dirname "$0")

# Change context to the script's directory
cd "$SCRIPT_DIR" || exit

# All the scripts initiated will receive this directory as reference

# 1. Database and Assets backup
./db_backup.sh