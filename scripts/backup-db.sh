#!/bin/bash
# Script de backup do PostgreSQL com rotacao de 7 dias.
# Uso: adicionar ao cron da VPS:
#   0 2 * * * /caminho/para/scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/kanban}"
CONTAINER="${CONTAINER:-kanban_app_postgres}"
DB_NAME="${DB_NAME:-kanban_db}"
DB_USER="${DB_USER:-kanban_user}"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Iniciando backup do banco $DB_NAME..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

echo "Removendo backups com mais de 7 dias..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup concluido: $BACKUP_DIR/backup_$DATE.sql.gz"
