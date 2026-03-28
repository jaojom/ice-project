#!/bin/bash
set -e

BACKUP_DIR="./backups"
CONTAINER_NAME="04_ice-postgres-1"
DB_USER="postgres"
DB_NAME="analytics_db"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting database backup..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_DIR}/${FILENAME}"
echo "[backup] Saved: ${BACKUP_DIR}/${FILENAME}"

# ลบ backup ที่เกิน 7 วัน
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -exec rm {} \;
echo "[backup] Old backups (>7 days) removed"
