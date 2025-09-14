#!/bin/bash

# OpenPOS SQLite Backup Script
# Creates a timestamped backup of the SQLite database before migration

set -e  # Exit on error

# Configuration
PRISMA_DIR="./prisma"
DB_FILE="$PRISMA_DIR/dev.db"
BACKUP_DIR="$PRISMA_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/dev_backup_$TIMESTAMP.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  OpenPOS SQLite Backup Script${NC}"
echo "=================================="

# Check if SQLite database exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ Error: SQLite database not found at $DB_FILE${NC}"
    echo "Please ensure the database exists before creating a backup."
    exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Get database size
DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
echo -e "${BLUE}📊 Database size: $DB_SIZE${NC}"

# Create backup
echo -e "${YELLOW}💾 Creating backup...${NC}"
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo -e "${GREEN}📍 Location: $BACKUP_FILE${NC}"
    
    # Verify backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}📊 Backup size: $BACKUP_SIZE${NC}"
    
    # List recent backups
    echo ""
    echo -e "${BLUE}📋 Recent backups:${NC}"
    ls -la "$BACKUP_DIR" | grep "dev_backup_" | tail -5
    
    # Cleanup old backups (keep last 10)
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 10)...${NC}"
    ls -t "$BACKUP_DIR"/dev_backup_*.db | tail -n +11 | xargs -r rm
    
    REMAINING_BACKUPS=$(ls "$BACKUP_DIR"/dev_backup_*.db 2>/dev/null | wc -l)
    echo -e "${GREEN}📁 Total backups remaining: $REMAINING_BACKUPS${NC}"
    
else
    echo -e "${RED}❌ Error: Failed to create backup${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Backup process completed!${NC}"
echo -e "${BLUE}💡 You can now safely proceed with the migration to Supabase.${NC}"
echo -e "${BLUE}💡 To restore from backup: cp $BACKUP_FILE $DB_FILE${NC}"