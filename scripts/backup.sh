#!/bin/bash
set -euo pipefail  # stop on any error, undefined var, or pipe failure

# ── Config ────────────────────────────────────────────────────
BACKUP_DIR="$HOME/jobtrackr-backups"
MONGO_CONTAINER="jobtrackr-mongo"
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_NAME="jobtrackr_$TIMESTAMP"

# ── Load credentials & Settings ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.prod"

if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(MONGO_ROOT_USER|MONGO_ROOT_PASS|RCLONE_REMOTE|BACKUP_RETENTION_DAYS)' "$ENV_FILE" | sed 's/#.*//' | xargs)
fi

# Set defaults if not provided in env
RCLONE_REMOTE="${RCLONE_REMOTE:-gdrive}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# ── Functions ─────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# ── Start ─────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

log "========================================="
log "Starting backup: $DUMP_NAME"

# Check container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_CONTAINER}$"; then
  log "ERROR: Container $MONGO_CONTAINER is not running"
  exit 1
fi

# ── Step 1: mongodump inside container ────────────────────────
log "Running mongodump..."
docker exec "$MONGO_CONTAINER" mongodump \
  --username "$MONGO_ROOT_USER" \
  --password "$MONGO_ROOT_PASS" \
  --authenticationDatabase admin \
  --db jobtrackr \
  --out "/tmp/$DUMP_NAME" \
  --quiet

# ── Step 2: Copy dump from container to host ──────────────────
log "Copying dump to host..."
docker cp "$MONGO_CONTAINER:/tmp/$DUMP_NAME" "$BACKUP_DIR/$DUMP_NAME"

# ── Step 3: Compress ──────────────────────────────────────────
log "Compressing..."
tar -czf "$BACKUP_DIR/$DUMP_NAME.tar.gz" -C "$BACKUP_DIR" "$DUMP_NAME"
rm -rf "$BACKUP_DIR/$DUMP_NAME"

# ── Step 4: Clean up temp inside container ────────────────────
docker exec "$MONGO_CONTAINER" rm -rf "/tmp/$DUMP_NAME"

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$DUMP_NAME.tar.gz" | cut -f1)
log "Backup created: $DUMP_NAME.tar.gz ($BACKUP_SIZE)"

# ── Step 5: Upload to Google Drive ────────────────────────────
log "Uploading to Google Drive..."
rclone copy "$BACKUP_DIR/$DUMP_NAME.tar.gz" "$RCLONE_REMOTE:jobtrackr-backups/" \
  --log-level INFO \
  2>> "$LOG_FILE"
log "Uploaded to Google Drive successfully"

# ── Step 6: Delete old local backups ──────────────────────────
log "Cleaning up local backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "jobtrackr_*.tar.gz" -mtime "+$RETENTION_DAYS" -delete
LOCAL_COUNT=$(find "$BACKUP_DIR" -name "jobtrackr_*.tar.gz" | wc -l)
log "Local backups kept: $LOCAL_COUNT"

log "Backup complete."
log "========================================="