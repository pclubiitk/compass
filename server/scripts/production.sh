#!/bin/bash

# We can seperate cleaup_old_backups.sh script
# so that we can run clean up jobs seperatly
set -e

echo "=== Backup started at $(date) ==="

# 1. Database backup
/srv/compass/scripts/pg_backup.sh

# 2. Sync mirror
/srv/compass/scripts/sync_mirror.sh

# 3. Snapshot backup
/srv/compass/scripts/backup_snapshot.sh

# 4. Cleanup old snapshots
/srv/compass/scripts/cleanup_old_backups.sh

echo "=== Backup finished at $(date) ==="
