#!/bin/bash
set -euo pipefail

BACKUP_DIR="$HOME/jobtrackr-backups"
MONGO_CONTAINER="jobtrackr-mongo"
LOG_FILE="$BACKUP_DIR/restore.log"

# ── Load credentials & Settings ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Auto-detect which env file to use
if [ "${NODE_ENV:-development}" = "production" ]; then
  ENV_FILE="$SCRIPT_DIR/../.env.prod"
else
  ENV_FILE="$SCRIPT_DIR/../.env"
fi

if [ -f "$ENV_FILE" ]; then
  # Read variables and export them
  set -a
  source "$ENV_FILE"
  set +a
fi

# Set defaults if not provided in env
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR"

# ── Handle --from-drive flag ──────────────────────────────────
if [ "${1:-}" = "--from-drive" ]; then
  log "Fetching latest backup from Google Drive..."
  
  # Get the latest file name from Drive
  LATEST_REMOTE=$(rclone ls "$RCLONE_REMOTE:jobtrackr-backups/" \
    | sort -k2 \
    | tail -1 \
    | awk '{print $2}')
  
  if [ -z "$LATEST_REMOTE" ]; then
    log "ERROR: No backups found on Google Drive ($RCLONE_REMOTE)"
    exit 1
  fi
  
  log "Downloading: $LATEST_REMOTE"
  rclone copy "$RCLONE_REMOTE:jobtrackr-backups/$LATEST_REMOTE" "$BACKUP_DIR/"
  BACKUP_FILE="$BACKUP_DIR/$LATEST_REMOTE"

# ── Use provided file or auto-select latest local ─────────────
elif [ -n "${1:-}" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/jobtrackr_*.tar.gz 2>/dev/null | head -1)
  
  if [ -z "$BACKUP_FILE" ]; then
    echo "No local backups found in $BACKUP_DIR"
    read -p "Would you like to check Google Drive for the latest backup? (yes/no): " CHECK_DRIVE
    if [ "$CHECK_DRIVE" = "yes" ]; then
       log "Fetching latest backup from Google Drive..."
       LATEST_REMOTE=$(rclone ls "$RCLONE_REMOTE:jobtrackr-backups/" | sort -k2 | tail -1 | awk '{print $2}')
       
       if [ -z "$LATEST_REMOTE" ]; then
         log "ERROR: No backups found on Google Drive ($RCLONE_REMOTE)"
         exit 1
       fi
       
       log "Downloading: $LATEST_REMOTE"
       rclone copy "$RCLONE_REMOTE:jobtrackr-backups/$LATEST_REMOTE" "$BACKUP_DIR/"
       BACKUP_FILE="$BACKUP_DIR/$LATEST_REMOTE"
    else
       echo "Restore aborted. No local files available."
       exit 1
    fi
  else
    log "Auto-selected latest local backup: $(basename $BACKUP_FILE)"
  fi
fi

# ── Confirm before restoring ──────────────────────────────────
echo ""
echo "  Backup file : $BACKUP_FILE"
echo "  Target DB   : jobtrackr (inside $MONGO_CONTAINER)"
echo "  WARNING     : --drop flag will REPLACE existing data"
echo ""
read -p "  Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled by user"
  exit 0
fi

log "========================================="
log "Starting restore from: $(basename $BACKUP_FILE)"

# ── Extract ───────────────────────────────────────────────────
RESTORE_TMP="/tmp/jobtrackr_restore_$$"
mkdir -p "$RESTORE_TMP"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_TMP"

# Find the jobtrackr folder inside the extracted dump
DUMP_FOLDER=$(find "$RESTORE_TMP" -name "jobtrackr" -type d | head -1)

if [ -z "$DUMP_FOLDER" ]; then
  log "ERROR: Could not find 'jobtrackr' folder inside backup"
  rm -rf "$RESTORE_TMP"
  exit 1
fi

# ── Copy into container ───────────────────────────────────────
log "Copying dump into container..."
docker cp "$DUMP_FOLDER" "$MONGO_CONTAINER:/tmp/restore_jobtrackr"

# ── mongorestore ──────────────────────────────────────────────
log "Running mongorestore..."
docker exec "$MONGO_CONTAINER" mongorestore \
  --username "$MONGO_ROOT_USER" \
  --password "$MONGO_ROOT_PASS" \
  --authenticationDatabase admin \
  --db jobtrackr \
  --drop \
  /tmp/restore_jobtrackr \
  --quiet

# ── Cleanup ───────────────────────────────────────────────────
docker exec "$MONGO_CONTAINER" rm -rf /tmp/restore_jobtrackr
rm -rf "$RESTORE_TMP"

log "Restore complete."
log "========================================="
echo ""
echo "Done. Open your app and verify the data."