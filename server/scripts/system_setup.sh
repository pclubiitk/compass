#!/bin/bash
set -e

# Get the directory where the script is located relative to the start
SCRIPT_DIR=$(dirname "$0")

# Change context to the script's directory
cd "$SCRIPT_DIR" || exit

# Create the Assets, logs folder
cd ..
mkdir -p logs
cd assets
mkdir -p pfp public tmp
cd ..

# TODO: Later add the env and secrets copy
